package middlewares

import (
	"net/http"

	"safelaunch/auth"
	"safelaunch/utils"

	"github.com/gin-gonic/gin"
)

// RequireAuth rejects any request carrying neither a valid API key nor a live dashboard
// session. See auth.IsAuthenticated for the credential shapes accepted.
func RequireAuth(apiKey string, sessions *auth.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		if auth.IsAuthenticated(c, apiKey, sessions) {
			c.Next()
			return
		}

		// Deliberately uniform: never reveal whether the credential was missing, malformed,
		// or merely wrong. That difference is free reconnaissance for anyone probing.
		utils.JSON(c, http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		c.Abort()
	}
}
