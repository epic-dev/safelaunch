package middlewares

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestPerformanceLogger_CallsNextAndPreservesResponse(t *testing.T) {
	router := gin.New()
	router.Use(PerformanceLogger())

	downstreamCalled := false
	router.GET("/ping", func(c *gin.Context) {
		downstreamCalled = true
		c.JSON(http.StatusTeapot, gin.H{"message": "pong"})
	})

	req := httptest.NewRequest(http.MethodGet, "/ping", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if !downstreamCalled {
		t.Fatal("expected downstream handler to be called via c.Next()")
	}
	if w.Code != http.StatusTeapot {
		t.Errorf("expected middleware to leave status untouched (%d), got %d", http.StatusTeapot, w.Code)
	}
	if body := w.Body.String(); body != `{"message":"pong"}` {
		t.Errorf("expected middleware to leave body untouched, got %q", body)
	}
}
