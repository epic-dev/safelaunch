package handlers

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	queries "safelaunch/db_queries"

	"github.com/gin-gonic/gin"
)

func newImportRequest(t *testing.T, filename, content string) *http.Request {
	t.Helper()

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		t.Fatalf("failed to create form file: %v", err)
	}
	if _, err := part.Write([]byte(content)); err != nil {
		t.Fatalf("failed to write form file content: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("failed to close multipart writer: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/import", &buf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	return req
}

func TestImportFeatureFlags_ValidJSON(t *testing.T) {
	db := newTestDB(t)
	router := gin.New()
	router.POST("/import", ImportFeatureFlags(db))

	content := `[
		{"key":"json-a","description":"a","enabled":true},
		{"key":"json-b","description":"b","enabled":false}
	]`
	req := newImportRequest(t, "flags.json", content)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d (body: %s)", http.StatusOK, w.Code, w.Body.String())
	}

	var total int
	if err := db.QueryRow(queries.GET_FEATURE_FLAG_COUNT).Scan(&total); err != nil {
		t.Fatalf("failed to count flags: %v", err)
	}
	if total != 2 {
		t.Errorf("expected 2 imported flags, got %d", total)
	}
}

func TestImportFeatureFlags_ValidYAML(t *testing.T) {
	db := newTestDB(t)
	router := gin.New()
	router.POST("/import", ImportFeatureFlags(db))

	content := "- key: yaml-a\n  description: a\n  enabled: true\n- key: yaml-b\n  description: b\n  enabled: false\n"
	req := newImportRequest(t, "flags.yaml", content)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d (body: %s)", http.StatusOK, w.Code, w.Body.String())
	}

	var total int
	if err := db.QueryRow(queries.GET_FEATURE_FLAG_COUNT).Scan(&total); err != nil {
		t.Fatalf("failed to count flags: %v", err)
	}
	if total != 2 {
		t.Errorf("expected 2 imported flags, got %d", total)
	}
}

func TestImportFeatureFlags_InvalidContent(t *testing.T) {
	db := newTestDB(t)
	router := gin.New()
	router.POST("/import", ImportFeatureFlags(db))

	req := newImportRequest(t, "flags.txt", "not valid content !!! {{{")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d (body: %s)", http.StatusBadRequest, w.Code, w.Body.String())
	}
}

func TestImportFeatureFlags_MissingFile(t *testing.T) {
	db := newTestDB(t)
	router := gin.New()
	router.POST("/import", ImportFeatureFlags(db))

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	writer.Close()

	req := httptest.NewRequest(http.MethodPost, "/import", &buf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d (body: %s)", http.StatusBadRequest, w.Code, w.Body.String())
	}
}

func TestImportFeatureFlags_DuplicateKeyRollsBack(t *testing.T) {
	db := newTestDB(t)
	seedFlag(t, db, "already-exists", "pre-existing", false)

	router := gin.New()
	router.POST("/import", ImportFeatureFlags(db))

	content := `[
		{"key":"fresh-flag","description":"should not survive","enabled":true},
		{"key":"already-exists","description":"conflict","enabled":true}
	]`
	req := newImportRequest(t, "flags.json", content)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected status %d, got %d (body: %s)", http.StatusInternalServerError, w.Code, w.Body.String())
	}

	var total int
	if err := db.QueryRow(queries.GET_FEATURE_FLAG_COUNT).Scan(&total); err != nil {
		t.Fatalf("failed to count flags: %v", err)
	}
	if total != 1 {
		t.Errorf("expected rollback to leave only the original seeded flag (total=1), got total=%d", total)
	}
}
