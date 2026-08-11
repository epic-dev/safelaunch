package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"safelaunch/types"

	"github.com/gin-gonic/gin"
)

func TestGetAllFeatureFlagsForSDK_ReturnsAllUnpaginated(t *testing.T) {
	db := newTestDB(t)
	for i := range 25 {
		seedFlag(t, db, "flag-"+strconv.Itoa(i), "desc", i%2 == 0)
	}

	router := gin.New()
	router.GET("/bulk/feature-flags", GetAllFeatureFlagsForSDK(db))

	req := httptest.NewRequest(http.MethodGet, "/bulk/feature-flags", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d (body: %s)", http.StatusOK, w.Code, w.Body.String())
	}

	var got []types.FeatureFlag
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if len(got) != 25 {
		t.Fatalf("expected all 25 flags with no pagination, got %d", len(got))
	}
	for i, flag := range got {
		want := "flag-" + strconv.Itoa(i)
		if flag.KEY != want {
			t.Errorf("expected flags ordered by id (index %d = %q), got %q", i, want, flag.KEY)
		}
	}
}

func TestGetAllFeatureFlagsForSDK_EmptyReturnsEmptyArray(t *testing.T) {
	db := newTestDB(t)

	router := gin.New()
	router.GET("/bulk/feature-flags", GetAllFeatureFlagsForSDK(db))

	req := httptest.NewRequest(http.MethodGet, "/bulk/feature-flags", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d (body: %s)", http.StatusOK, w.Code, w.Body.String())
	}

	body := w.Body.String()
	if body != "[]" {
		t.Errorf("expected an empty JSON array \"[]\" for zero flags, got %q", body)
	}
}
