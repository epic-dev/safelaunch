package handlers

import (
	"net/http"

	"safelaunch/auth"
	"safelaunch/utils"

	"github.com/gin-gonic/gin"
)

type sessionRequest struct {
	APIKey string `json:"apiKey"`
}

// CreateSession exchanges a valid API key for an HttpOnly session cookie. This is the
// dashboard's login: the browser sends the key exactly once, here, and never holds it again.
//
// secureCookies should be false only when serving plain HTTP locally - a Secure cookie is
// silently dropped by the browser over http://.
func CreateSession(apiKey string, sessions *auth.Store, secureCookies bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Authentication is switched off, so there is nothing to exchange. Report success
		// rather than an error: the dashboard is already free to call the API.
		if apiKey == "" {
			c.Status(http.StatusNoContent)
			return
		}

		var req sessionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.JSON(c, http.StatusBadRequest, gin.H{"message": "Invalid request body"})
			return
		}

		if !auth.KeyMatches(req.APIKey, apiKey) {
			utils.JSON(c, http.StatusUnauthorized, gin.H{"message": "Invalid API key"})
			return
		}

		token, err := sessions.Create()
		if err != nil {
			utils.JSON(c, http.StatusInternalServerError, gin.H{"message": "Failed to create session"})
			return
		}

		setSessionCookie(c, token, int(auth.SessionTTL.Seconds()), secureCookies)
		c.Status(http.StatusNoContent)
	}
}

// DeleteSession logs the dashboard out: the token stops being valid server-side, not just
// in the browser, so clearing the cookie alone can't be used to keep a stolen session alive.
func DeleteSession(sessions *auth.Store, secureCookies bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		if token, err := c.Cookie(auth.SessionCookieName); err == nil {
			sessions.Revoke(token)
		}

		setSessionCookie(c, "", -1, secureCookies)
		c.Status(http.StatusNoContent)
	}
}

// SessionStatus tells the dashboard whether it needs to ask for a key at all, and whether
// the session it already has is still good. It is unauthenticated by necessity - it is the
// call the dashboard makes before it has any credential to present.
func SessionStatus(apiKey string, sessions *auth.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		utils.JSON(c, http.StatusOK, gin.H{
			"authRequired":  apiKey != "",
			"authenticated": auth.IsAuthenticated(c, apiKey, sessions),
		})
	}
}

// setSessionCookie writes the session cookie with the flags that make this approach worth
// the extra endpoint: HttpOnly keeps it away from JavaScript (so an XSS bug cannot read the
// credential), and SameSite=Strict keeps it off cross-site requests (so no other origin can
// ride the session). The dashboard and API share an origin - and the Vite dev server proxies
// /api - so Strict never gets in the dashboard's way.
func setSessionCookie(c *gin.Context, token string, maxAge int, secure bool) {
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie(auth.SessionCookieName, token, maxAge, "/", "", secure, true)
}
