package middlewares

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
)

/**
TODO: Log to somthing like Prometheus or Grafana instead of just printing to stdout.
*/

func PerformanceLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()
		c.Next()
		latency := time.Since(startTime)
		slog.Info("Request completed", "method", c.Request.Method, "path", c.Request.URL.Path, "latency", latency)
	}
}
