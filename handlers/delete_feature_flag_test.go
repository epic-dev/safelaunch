package handlers

import (
	"database/sql"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	queries "safelaunch/db_queries"
	"safelaunch/types"

	"github.com/gin-gonic/gin"
)

func TestDeleteFeatureFlag_Success(t *testing.T) {
	db := newTestDB(t)
	id := seedFlag(t, db, "to-delete", "desc", false)

	router := gin.New()
	router.DELETE("/feature-flags/:id", DeleteFeatureFlag(db))

	req := httptest.NewRequest(http.MethodDelete, "/feature-flags/"+strconv.FormatInt(id, 10), nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Fatalf("expected status %d, got %d (body: %s)", http.StatusNoContent, w.Code, w.Body.String())
	}

	row := db.QueryRow(queries.GET_FEATURE_FLAG_BY_ID, id)
	var flag types.FeatureFlag
	if err := row.Scan(&flag.ID, &flag.KEY, &flag.DESCRIPTION, &flag.ENABLED, &flag.CREATED_AT); err != sql.ErrNoRows {
		t.Errorf("expected flag %d to be gone, got err=%v", id, err)
	}
}

func TestDeleteFeatureFlag_NonexistentID(t *testing.T) {
	db := newTestDB(t)

	router := gin.New()
	router.DELETE("/feature-flags/:id", DeleteFeatureFlag(db))

	req := httptest.NewRequest(http.MethodDelete, "/feature-flags/999999", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	// DELETE with no matching row is not a SQL error - it's a no-op that still
	// reports success, same as a real delete. Documenting current behavior.
	if w.Code != http.StatusNoContent {
		t.Fatalf("expected status %d for a no-op delete, got %d (body: %s)", http.StatusNoContent, w.Code, w.Body.String())
	}
}

