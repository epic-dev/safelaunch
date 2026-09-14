package middlewares

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"safelaunch/auth"

	"github.com/gin-gonic/gin"
)

const testAPIKey = "test-api-key-value"

// protectedRouter builds a router whose single route is reachable only through RequireAuth,
// and reports whether that route was actually reached.
func protectedRouter(apiKey string, sessions *auth.Store) (*gin.Engine, *bool) {
	reached := false

	router := gin.New()
	router.Use(RequireAuth(apiKey, sessions))
	router.GET("/protected", func(c *gin.Context) {
		reached = true
		c.JSON(http.StatusOK, gin.H{"message": "ok"})
	})

	return router, &reached
}

func TestRequireAuth_RejectsRequestWithoutCredential(t *testing.T) {
	router, reached := protectedRouter(testAPIKey, auth.NewStore())

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected %d for a request with no credential, got %d", http.StatusUnauthorized, w.Code)
	}
	if *reached {
		t.Error("expected the protected handler never to run")
	}
}

func TestRequireAuth_RejectsWrongAPIKey(t *testing.T) {
	router, reached := protectedRouter(testAPIKey, auth.NewStore())

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer not-the-right-key")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected %d for a wrong key, got %d", http.StatusUnauthorized, w.Code)
	}
	if *reached {
		t.Error("expected the protected handler never to run")
	}
}

// The 401 body must not hint at why the credential failed - a distinguishable response for
// "missing" vs "wrong" tells an attacker when they have found a real key prefix.
func TestRequireAuth_DoesNotLeakWhyTheCredentialFailed(t *testing.T) {
	router, _ := protectedRouter(testAPIKey, auth.NewStore())

	missing := httptest.NewRequest(http.MethodGet, "/protected", nil)
	missingResponse := httptest.NewRecorder()
	router.ServeHTTP(missingResponse, missing)

	wrong := httptest.NewRequest(http.MethodGet, "/protected", nil)
	wrong.Header.Set("Authorization", "Bearer not-the-right-key")
	wrongResponse := httptest.NewRecorder()
	router.ServeHTTP(wrongResponse, wrong)

	if missingResponse.Body.String() != wrongResponse.Body.String() {
		t.Errorf("expected identical bodies for missing and wrong credentials, got %q and %q",
			missingResponse.Body.String(), wrongResponse.Body.String())
	}
	if body := missingResponse.Body.String(); body != `{"message":"Unauthorized"}` {
		t.Errorf("unexpected 401 body: %q", body)
	}
}

func TestRequireAuth_AcceptsValidAPIKey(t *testing.T) {
	router, reached := protectedRouter(testAPIKey, auth.NewStore())

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+testAPIKey)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected %d for a valid key, got %d", http.StatusOK, w.Code)
	}
	if !*reached {
		t.Error("expected the protected handler to run")
	}
}

func TestRequireAuth_AcceptsValidSessionCookie(t *testing.T) {
	sessions := auth.NewStore()
	router, reached := protectedRouter(testAPIKey, sessions)

	token, err := sessions.Create()
	if err != nil {
		t.Fatalf("failed to create session: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.AddCookie(&http.Cookie{Name: auth.SessionCookieName, Value: token})
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected %d for a valid session cookie, got %d", http.StatusOK, w.Code)
	}
	if !*reached {
		t.Error("expected the protected handler to run")
	}
}

func TestRequireAuth_RejectsRevokedSessionCookie(t *testing.T) {
	sessions := auth.NewStore()
	router, _ := protectedRouter(testAPIKey, sessions)

	token, err := sessions.Create()
	if err != nil {
		t.Fatalf("failed to create session: %v", err)
	}
	sessions.Revoke(token)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.AddCookie(&http.Cookie{Name: auth.SessionCookieName, Value: token})
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected %d after the session was revoked, got %d", http.StatusUnauthorized, w.Code)
	}
}

// An empty configured key means development-mode-without-auth. main.go guarantees this can
// only happen when ENV=development, but the middleware has to honour it.
func TestRequireAuth_AllowsEverythingWhenNoKeyConfigured(t *testing.T) {
	router, reached := protectedRouter("", auth.NewStore())

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected %d when auth is disabled, got %d", http.StatusOK, w.Code)
	}
	if !*reached {
		t.Error("expected the protected handler to run when auth is disabled")
	}
}
