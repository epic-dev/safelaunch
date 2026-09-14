package main

import (
	"database/sql"
	"embed"
	"io/fs"
	"log/slog"
	"net/http"
	"os"

	"safelaunch/auth"
	queries "safelaunch/db_queries"
	"safelaunch/middlewares"
	"safelaunch/types"
	"strings"

	"safelaunch/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	_ "modernc.org/sqlite"
)

var feature_flags = []types.FeatureFlag{
	{
		ID:          1,
		KEY:         "enable_new_ui",
		DESCRIPTION: "Enable the new user interface for testing.",
		ENABLED:     false,
	},
	{
		ID:          2,
		KEY:         "enable_beta_feature",
		DESCRIPTION: "Enable the beta feature for selected users.",
		ENABLED:     true,
	},
}

func startDatabase() *sql.DB {
	slog.Info("Starting database connection...")
	// TODO: use app name for database filename and path, to avoid conflicts with other applications
	db, err := sql.Open("sqlite", "./db/feature_flags.db")
	if err != nil {
		slog.Error("Failed to connect to the database", "error", err)
		panic(err)
	}

	_, err = db.Exec(queries.INITIALIZE_DATABASE)
	if err != nil {
		slog.Error("Failed to create table", "error", err)
		panic(err)
	}
	slog.Info("Database connected and initialized successfully.")
	return db
}

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "healthy"})
}

// resolveAPIKey reads the key every caller must present, and decides what to do when there
// isn't one.
//
// Outside development a missing key is fatal: a feature flag server reachable without a
// credential lets anyone toggle production behaviour, so refusing to boot is the only safe
// default. In development it degrades to an open server with a loud warning, so `go run .`
// and the test suites stay frictionless.
func resolveAPIKey(isDevelopment bool) string {
	apiKey := os.Getenv("SAFELAUNCH_API_KEY")
	if apiKey != "" {
		return apiKey
	}

	if !isDevelopment {
		slog.Error("SAFELAUNCH_API_KEY is not set - refusing to start an unauthenticated server. " +
			"Set SAFELAUNCH_API_KEY to a long random string, or set ENV=development to run without auth locally.")
		os.Exit(1)
	}

	slog.Warn("SAFELAUNCH_API_KEY is not set - API authentication is DISABLED. " +
		"This is allowed because ENV=development. Never run this way anywhere reachable.")

	return ""
}

//go:embed frontend/dist
var frontend embed.FS

func main() {
	_ = godotenv.Load()
	logHandler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	slog.SetDefault(slog.New(logHandler))

	slog.Info("Environment initialized", "env", os.Getenv("ENV"))

	isDevelopment := os.Getenv("ENV") == "development"
	apiKey := resolveAPIKey(isDevelopment)
	sessions := auth.NewStore()

	db := startDatabase()
	defer db.Close()

	router := gin.Default()

	if isDevelopment {
		router.Use(cors.New(cors.Config{
			AllowOrigins: []string{"http://localhost:5173"},
			AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
			AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
			// Needed for the session cookie on any direct cross-origin call. The Vite dev
			// server proxies /api, so the dashboard itself stays same-origin either way.
			AllowCredentials: true,
		}))
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	router.Use(middlewares.PerformanceLogger())

	// Secure cookies are dropped by browsers over plain HTTP, which is how the server is
	// reached locally. Everywhere else, the cookie must not travel unencrypted.
	secureCookies := !isDevelopment

	api := router.Group("/api/v1")
	{
		// Open by necessity: healthz is what a load balancer polls, and the session routes
		// are how a caller obtains a credential in the first place.
		api.GET("/healthz", healthCheck)
		api.GET("/auth/session", handlers.SessionStatus(apiKey, sessions))
		api.POST("/auth/session", handlers.CreateSession(apiKey, sessions, secureCookies))
		api.DELETE("/auth/session", handlers.DeleteSession(sessions, secureCookies))

		protected := api.Group("", middlewares.RequireAuth(apiKey, sessions))
		{
			protected.GET("/feature-flags", handlers.GetAllFeatureFlags(db))
			protected.GET("/bulk/feature-flags", handlers.GetAllFeatureFlagsForSDK(db))
			protected.GET("/feature-flags/:key", handlers.GetFeatureFlagByKey(db))
			protected.POST("/feature-flags", handlers.CreateFeatureFlag(db))
			protected.PATCH("/feature-flags/:id", handlers.UpdateFeatureFlag(db))
			protected.DELETE("/feature-flags/:id", handlers.DeleteFeatureFlag(db))
			protected.POST("/import", handlers.ImportFeatureFlags(db))
		}
	}

	distFs, err := fs.Sub(frontend, "frontend/dist")
	if err != nil {
		slog.Error("Failed to create sub filesystem", "error", err)
	}

	fileServer := http.FileServer(http.FS(distFs))

	router.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path

		// NEVER serve index.html for unknown /api routes -> Return proper 404 JSON
		if strings.HasPrefix(path, "/api") {
			c.JSON(http.StatusNotFound, gin.H{"error": "API endpoint not found"})
			return
		}

		// Check if the requested static file actually exists in distFs
		filePath := strings.TrimPrefix(path, "/")
		if _, err := distFs.Open(filePath); err == nil {
			fileServer.ServeHTTP(c.Writer, c.Request)
			return
		}

		// Otherwise, fall back to index.html for SPA client-side routing (e.g. /settings)
		c.FileFromFS("/", http.FS(distFs))
	})

	slog.Info("Starting server on port 8080...")
	router.Run(":8080")
}
