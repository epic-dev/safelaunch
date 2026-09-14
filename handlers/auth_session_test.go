package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"safelaunch/auth"

	"github.com/gin-gonic/gin"
)

const testAPIKey = "test-api-key-value"

// sessionRouter mounts the three session routes the way main.go does.
func sessionRouter(apiKey string, sessions *auth.Store) *gin.Engine {
	router := gin.New()
	router.GET("/auth/session", SessionStatus(apiKey, sessions))
	router.POST("/auth/session", CreateSession(apiKey, sessions, false))
	router.DELETE("/auth/session", DeleteSession(sessions, false))

	return router
}

// sessionCookie finds the session cookie on a response, if one was set.
func sessionCookie(t *testing.T, w *httptest.ResponseRecorder) *http.Cookie {
	t.Helper()

	for _, cookie := range w.Result().Cookies() {
		if cookie.Name == auth.SessionCookieName {
			return cookie
		}
	}

	return nil
}

func postSession(router *gin.Engine, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "/auth/session", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	return w
}

func TestCreateSession_ValidKeyIssuesCookie(t *testing.T) {
	router := sessionRouter(testAPIKey, auth.NewStore())

	w := postSession(router, `{"apiKey":"`+testAPIKey+`"}`)

	if w.Code != http.StatusNoContent {
		t.Fatalf("expected %d for a valid key, got %d", http.StatusNoContent, w.Code)
	}

	cookie := sessionCookie(t, w)
	if cookie == nil {
		t.Fatal("expected a session cookie to be set")
	}
	if cookie.Value == "" {
		t.Error("expected the session cookie to carry a token")
	}
}

// The whole point of the cookie exchange is that the browser stops holding the key. If the
// cookie were readable by JavaScript, or rode along on cross-site requests, that would be lost.
func TestCreateSession_CookieIsHttpOnlyAndSameSiteStrict(t *testing.T) {
	router := sessionRouter(testAPIKey, auth.NewStore())

	cookie := sessionCookie(t, postSession(router, `{"apiKey":"`+testAPIKey+`"}`))
	if cookie == nil {
		t.Fatal("expected a session cookie to be set")
	}

	if !cookie.HttpOnly {
		t.Error("expected the session cookie to be HttpOnly")
	}
	if cookie.SameSite != http.SameSiteStrictMode {
		t.Errorf("expected SameSite=Strict, got %v", cookie.SameSite)
	}
	if cookie.Path != "/" {
		t.Errorf("expected the cookie to cover the whole site, got path %q", cookie.Path)
	}
}

// The raw key must never come back in the response - only the opaque session token does.
func TestCreateSession_DoesNotEchoTheAPIKey(t *testing.T) {
	router := sessionRouter(testAPIKey, auth.NewStore())

	w := postSession(router, `{"apiKey":"`+testAPIKey+`"}`)

	if strings.Contains(w.Body.String(), testAPIKey) {
		t.Errorf("response body leaked the API key: %q", w.Body.String())
	}
	if cookie := sessionCookie(t, w); cookie != nil && strings.Contains(cookie.Value, testAPIKey) {
		t.Error("session token leaked the API key")
	}
}

func TestCreateSession_WrongKeyIsRejectedWithoutCookie(t *testing.T) {
	router := sessionRouter(testAPIKey, auth.NewStore())

	w := postSession(router, `{"apiKey":"not-the-right-key"}`)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected %d for a wrong key, got %d", http.StatusUnauthorized, w.Code)
	}
	if cookie := sessionCookie(t, w); cookie != nil && cookie.Value != "" {
		t.Error("expected no session cookie to be issued for a wrong key")
	}
}

func TestCreateSession_MalformedBodyIsRejected(t *testing.T) {
	router := sessionRouter(testAPIKey, auth.NewStore())

	w := postSession(router, `not json at all`)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected %d for a malformed body, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestDeleteSession_RevokesTheTokenServerSide(t *testing.T) {
	sessions := auth.NewStore()
	router := sessionRouter(testAPIKey, sessions)

	cookie := sessionCookie(t, postSession(router, `{"apiKey":"`+testAPIKey+`"}`))
	if cookie == nil {
		t.Fatal("expected a session cookie to be set")
	}

	req := httptest.NewRequest(http.MethodDelete, "/auth/session", nil)
	req.AddCookie(&http.Cookie{Name: auth.SessionCookieName, Value: cookie.Value})
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("expected %d from logout, got %d", http.StatusNoContent, w.Code)
	}
	// Clearing the browser's cookie is not enough: a copied token must stop working too.
	if sessions.Valid(cookie.Value) {
		t.Error("expected the token to be revoked server-side, not just cleared in the browser")
	}
}

func decodeStatus(t *testing.T, w *httptest.ResponseRecorder) map[string]any {
	t.Helper()

	var body map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to decode status response %q: %v", w.Body.String(), err)
	}

	return body
}

func TestSessionStatus_ReportsUnauthenticatedWithoutCredential(t *testing.T) {
	router := sessionRouter(testAPIKey, auth.NewStore())

	req := httptest.NewRequest(http.MethodGet, "/auth/session", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	body := decodeStatus(t, w)
	if body["authRequired"] != true {
		t.Error("expected authRequired to be true when a key is configured")
	}
	if body["authenticated"] != false {
		t.Error("expected authenticated to be false without a credential")
	}
}

func TestSessionStatus_ReportsAuthenticatedWithSessionCookie(t *testing.T) {
	sessions := auth.NewStore()
	router := sessionRouter(testAPIKey, sessions)

	cookie := sessionCookie(t, postSession(router, `{"apiKey":"`+testAPIKey+`"}`))
	if cookie == nil {
		t.Fatal("expected a session cookie to be set")
	}

	req := httptest.NewRequest(http.MethodGet, "/auth/session", nil)
	req.AddCookie(&http.Cookie{Name: auth.SessionCookieName, Value: cookie.Value})
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if body := decodeStatus(t, w); body["authenticated"] != true {
		t.Error("expected authenticated to be true with a live session cookie")
	}
}

// With auth disabled the dashboard must not show a key prompt, so the status call has to say
// so explicitly rather than leaving the UI to guess.
func TestSessionStatus_ReportsAuthNotRequiredWhenNoKeyConfigured(t *testing.T) {
	router := sessionRouter("", auth.NewStore())

	req := httptest.NewRequest(http.MethodGet, "/auth/session", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	body := decodeStatus(t, w)
	if body["authRequired"] != false {
		t.Error("expected authRequired to be false when no key is configured")
	}
	if body["authenticated"] != true {
		t.Error("expected authenticated to be true when auth is disabled")
	}
}
