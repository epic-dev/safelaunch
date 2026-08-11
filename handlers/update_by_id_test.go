package handlers

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	queries "safelaunch/db_queries"
	"safelaunch/types"

	"github.com/gin-gonic/gin"
)

func TestUpdateFeatureFlag_PartialUpdateEnabledOnly(t *testing.T) {
	db := newTestDB(t)
	id := seedFlag(t, db, "original-key", "original-desc", false)

	router := gin.New()
	router.PATCH("/feature-flags/:id", UpdateFeatureFlag(db))

	req := httptest.NewRequest(http.MethodPatch, "/feature-flags/"+strconv.FormatInt(id, 10), bytes.NewBufferString(`{"enabled":true}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d (body: %s)", http.StatusOK, w.Code, w.Body.String())
	}

	var flag types.FeatureFlag
	row := db.QueryRow(queries.GET_FEATURE_FLAG_BY_ID, id)
	if err := row.Scan(&flag.ID, &flag.KEY, &flag.DESCRIPTION, &flag.ENABLED, &flag.CREATED_AT); err != nil {
		t.Fatalf("failed to read back flag: %v", err)
	}

	if flag.KEY != "original-key" {
		t.Errorf("expected key to stay %q (COALESCE with nil), got %q", "original-key", flag.KEY)
	}
	if flag.DESCRIPTION != "original-desc" {
		t.Errorf("expected description to stay %q, got %q", "original-desc", flag.DESCRIPTION)
	}
	if !flag.ENABLED {
		t.Errorf("expected enabled to become true, got false")
	}
}

func TestUpdateFeatureFlag_PartialUpdateKeyOnly(t *testing.T) {
	db := newTestDB(t)
	id := seedFlag(t, db, "old-key", "keep-me", true)

	router := gin.New()
	router.PATCH("/feature-flags/:id", UpdateFeatureFlag(db))

	req := httptest.NewRequest(http.MethodPatch, "/feature-flags/"+strconv.FormatInt(id, 10), bytes.NewBufferString(`{"key":"new-key"}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d (body: %s)", http.StatusOK, w.Code, w.Body.String())
	}

	var flag types.FeatureFlag
	row := db.QueryRow(queries.GET_FEATURE_FLAG_BY_ID, id)
	if err := row.Scan(&flag.ID, &flag.KEY, &flag.DESCRIPTION, &flag.ENABLED, &flag.CREATED_AT); err != nil {
		t.Fatalf("failed to read back flag: %v", err)
	}

	if flag.KEY != "new-key" {
		t.Errorf("expected key to become %q, got %q", "new-key", flag.KEY)
	}
	if flag.DESCRIPTION != "keep-me" {
		t.Errorf("expected description to stay %q, got %q", "keep-me", flag.DESCRIPTION)
	}
	if !flag.ENABLED {
		t.Errorf("expected enabled to stay true, got false")
	}
}

func TestUpdateFeatureFlag_InvalidBody(t *testing.T) {
	db := newTestDB(t)
	id := seedFlag(t, db, "some-key", "desc", false)

	router := gin.New()
	router.PATCH("/feature-flags/:id", UpdateFeatureFlag(db))

	req := httptest.NewRequest(http.MethodPatch, "/feature-flags/"+strconv.FormatInt(id, 10), bytes.NewBufferString(`not json`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d (body: %s)", http.StatusBadRequest, w.Code, w.Body.String())
	}
}

func TestUpdateFeatureFlag_NonexistentID(t *testing.T) {
	db := newTestDB(t)

	router := gin.New()
	router.PATCH("/feature-flags/:id", UpdateFeatureFlag(db))

	req := httptest.NewRequest(http.MethodPatch, "/feature-flags/999999", bytes.NewBufferString(`{"enabled":true}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// UPDATE against a non-matching WHERE clause is not a SQL error - documenting
	// current behavior (no 404 for an unknown id).
	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d for a no-op update, got %d (body: %s)", http.StatusOK, w.Code, w.Body.String())
	}
}
