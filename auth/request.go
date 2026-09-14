package auth

import (
	"strings"

	"github.com/gin-gonic/gin"
)

const bearerPrefix = "Bearer "

// IsAuthenticated reports whether a request carries a usable credential.
//
// Two shapes are accepted because there are two kinds of caller: the SDK and CLI hold the
// raw API key and send it as a bearer token, while the dashboard runs in a browser and
// exchanges the key once for an HttpOnly cookie, so the key itself never sits in
// JavaScript-reachable storage.
//
// An empty configured key means authentication is switched off - see main.go, which permits
// that only in development.
func IsAuthenticated(c *gin.Context, apiKey string, sessions *Store) bool {
	if apiKey == "" {
		return true
	}

	if presented, ok := BearerToken(c); ok && KeyMatches(presented, apiKey) {
		return true
	}

	token, err := c.Cookie(SessionCookieName)
	return err == nil && sessions.Valid(token)
}

// BearerToken pulls the credential out of an Authorization header, if there is one.
func BearerToken(c *gin.Context) (string, bool) {
	header := c.GetHeader("Authorization")
	if len(header) <= len(bearerPrefix) || !strings.EqualFold(header[:len(bearerPrefix)], bearerPrefix) {
		return "", false
	}

	return header[len(bearerPrefix):], true
}
