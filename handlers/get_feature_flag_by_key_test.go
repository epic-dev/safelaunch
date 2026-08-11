package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"safelaunch/types"

	"github.com/gin-gonic/gin"
)

func TestGetFeatureFlagByKey_Found(t *testing.T) {
	db := newTestDB(t)
	seedFlag(t, db, "existing-flag", "desc", true)

	router := gin.New()
	router.GET("/feature-flags/:key", GetFeatureFlagByKey(db))

	req := httptest.NewRequest(http.MethodGet, "/feature-flags/existing-flag", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d (body: %s)", http.StatusOK, w.Code, w.Body.String())
	}

	var got types.FeatureFlag
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
		t.Fatalf("failed to unmarshal response: %v (body: %s)", err, w.Body.String())
	}

	if got.KEY != "existing-flag" {
		t.Errorf("expected key %q, got %q", "existing-flag", got.KEY)
	}
}

func TestGetFeatureFlagByKey_NotFound(t *testing.T) {
	db := newTestDB(t)

	router := gin.New()
	router.GET("/feature-flags/:key", GetFeatureFlagByKey(db))

	req := httptest.NewRequest(http.MethodGet, "/feature-flags/does-not-exist", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d (body: %s)", http.StatusNotFound, w.Code, w.Body.String())
	}
}
