package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestGetAllFeatureFlags_DefaultPagination(t *testing.T) {
	db := newTestDB(t)
	for i := range 15 {
		seedFlag(t, db, "flag-"+strconv.Itoa(i), "desc", false)
	}

	router := gin.New()
	router.GET("/feature-flags", GetAllFeatureFlags(db))

	req := httptest.NewRequest(http.MethodGet, "/feature-flags", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d (body: %s)", http.StatusOK, w.Code, w.Body.String())
	}

	var got PaginatedResult
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if got.Total != 15 {
		t.Errorf("expected total=15, got %d", got.Total)
	}
	if len(got.FeatureFlags) != 10 {
		t.Errorf("expected default limit of 10 flags, got %d", len(got.FeatureFlags))
	}
	if got.FeatureFlags[0].KEY != "flag-0" {
		t.Errorf("expected first flag to be flag-0, got %q", got.FeatureFlags[0].KEY)
	}
}

func TestGetAllFeatureFlags_ExplicitPagination(t *testing.T) {
	db := newTestDB(t)
	for i := range 5 {
		seedFlag(t, db, "flag-"+strconv.Itoa(i), "desc", false)
	}

	router := gin.New()
	router.GET("/feature-flags", GetAllFeatureFlags(db))

	req := httptest.NewRequest(http.MethodGet, "/feature-flags?limit=2&offset=2", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var got PaginatedResult
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if got.Total != 5 {
		t.Errorf("expected total=5, got %d", got.Total)
	}
	if len(got.FeatureFlags) != 2 {
		t.Fatalf("expected 2 flags for limit=2, got %d", len(got.FeatureFlags))
	}
	if got.FeatureFlags[0].KEY != "flag-2" || got.FeatureFlags[1].KEY != "flag-3" {
		t.Errorf("expected [flag-2, flag-3] for offset=2 limit=2, got [%s, %s]",
			got.FeatureFlags[0].KEY, got.FeatureFlags[1].KEY)
	}
}

func TestGetAllFeatureFlags_Empty(t *testing.T) {
	db := newTestDB(t)

	router := gin.New()
	router.GET("/feature-flags", GetAllFeatureFlags(db))

	req := httptest.NewRequest(http.MethodGet, "/feature-flags", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d (body: %s)", http.StatusOK, w.Code, w.Body.String())
	}

	var got PaginatedResult
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if got.Total != 0 {
		t.Errorf("expected total=0, got %d", got.Total)
	}
	if got.FeatureFlags == nil {
		t.Errorf("expected featureFlags to be an empty slice, not nil/null")
	}
	if len(got.FeatureFlags) != 0 {
		t.Errorf("expected 0 flags, got %d", len(got.FeatureFlags))
	}
}
