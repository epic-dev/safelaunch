package handlers

import (
	"database/sql"
	"log/slog"
	"net/http"

	queries "safelaunch/db_queries"
	"safelaunch/types"

	"github.com/gin-gonic/gin"
)

func GetFeatureFlagByKey(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.Param("key")
		row := db.QueryRowContext(c.Request.Context(), queries.GET_FEATURE_FLAG_BY_KEY, key)
		var flag types.FeatureFlag
		if err := row.Scan(&flag.ID, &flag.KEY, &flag.DESCRIPTION, &flag.ENABLED); err != nil {
			if err == sql.ErrNoRows {
				slog.Info("Feature flag not found", "key", key)
				c.IndentedJSON(http.StatusNotFound, gin.H{"message": "Feature flag not found"})
			} else {
				slog.Error("Failed to scan feature flag", "error", err)
				c.IndentedJSON(http.StatusInternalServerError, gin.H{"message": "Failed to scan feature flag"})
			}
		}
		c.IndentedJSON(http.StatusOK, flag)
	}
}
