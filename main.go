package main

import (
	"database/sql"
	"embed"
	"io/fs"
	"log/slog"
	"net/http"
	"os"

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

//go:embed frontend/dist
var frontend embed.FS

func main() {
	_ = godotenv.Load()
	logHandler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	slog.SetDefault(slog.New(logHandler))

	slog.Info("Environment initialized", "env", os.Getenv("ENV"))

	db := startDatabase()
	defer db.Close()

	router := gin.Default()

	if os.Getenv("ENV") == "development" {
		router.Use(cors.New(cors.Config{
			AllowOrigins: []string{"http://localhost:5173"},
			AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
			AllowHeaders: []string{"Origin", "Content-Type"},
		}))
	}

	router.Use(middlewares.PerformanceLogger())

	api := router.Group("/api/v1")
	{
		api.GET("/healthz", healthCheck)
		api.GET("/feature-flags", handlers.GetAllFeatureFlags(db))
		api.GET("/feature-flags/:key", handlers.GetFeatureFlagByKey(db))
		api.POST("/feature-flags", handlers.CreateFeatureFlag(db))
		api.PATCH("/feature-flags/:id", handlers.UpdateFeatureFlag(db))
		api.DELETE("/feature-flags/:id", handlers.DeleteFeatureFlag(db))
		api.POST("/import", handlers.ImportFeatureFlags(db))
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
