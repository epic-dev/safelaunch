package handlers

import (
	"database/sql"
	"log/slog"
	"net/http"

	queries "safelaunch/db_queries"
	"safelaunch/types"
	"safelaunch/utils"

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
				utils.JSON(c, http.StatusNotFound, gin.H{"message": "Feature flag not found"})
			} else {
				slog.Error("Failed to scan feature flag", "error", err)
				utils.JSON(c, http.StatusInternalServerError, gin.H{"message": "Failed to scan feature flag"})
			}
		}
		utils.JSON(c, http.StatusOK, flag)
	}
}
