package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"safelaunch/types"

	"github.com/gin-gonic/gin"
)

func TestCreateFeatureFlag_Success(t *testing.T) {
	db := newTestDB(t)
	router := gin.New()
	router.POST("/feature-flags", CreateFeatureFlag(db))

	body := `{"key":"new-flag","description":"desc","enabled":true}`
	req := httptest.NewRequest(http.MethodPost, "/feature-flags", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d (body: %s)", http.StatusCreated, w.Code, w.Body.String())
	}

	var got types.FeatureFlag
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if got.ID == 0 {
		t.Errorf("expected a non-zero id, got %d", got.ID)
	}
	if got.KEY != "new-flag" {
		t.Errorf("expected key %q, got %q", "new-flag", got.KEY)
	}
	if got.DESCRIPTION != "desc" {
		t.Errorf("expected description %q, got %q", "desc", got.DESCRIPTION)
	}
	if !got.ENABLED {
		t.Errorf("expected enabled=true, got false")
	}
	if got.CREATED_AT == "" {
		t.Errorf("expected created_at to be set")
	}
}

func TestCreateFeatureFlag_InvalidBody(t *testing.T) {
	db := newTestDB(t)
	router := gin.New()
	router.POST("/feature-flags", CreateFeatureFlag(db))

	req := httptest.NewRequest(http.MethodPost, "/feature-flags", bytes.NewBufferString(`not json`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d (body: %s)", http.StatusBadRequest, w.Code, w.Body.String())
	}
}

func TestCreateFeatureFlag_DuplicateKey(t *testing.T) {
	db := newTestDB(t)
	seedFlag(t, db, "dup-flag", "existing", false)

	router := gin.New()
	router.POST("/feature-flags", CreateFeatureFlag(db))

	body := `{"key":"dup-flag","description":"conflict","enabled":false}`
	req := httptest.NewRequest(http.MethodPost, "/feature-flags", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected status %d for duplicate key, got %d (body: %s)", http.StatusInternalServerError, w.Code, w.Body.String())
	}
}
