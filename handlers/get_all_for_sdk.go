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

func GetAllFeatureFlagsForSDK(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		flags := []types.FeatureFlag{}
		rows, err := db.QueryContext(c, queries.GET_ALL_FEATURE_FLAGS_SDK)
		if err != nil {
			slog.Error("Failed to query feature flags for SDK", "error", err)
			utils.JSON(c, http.StatusInternalServerError, gin.H{"message": "Failed to retrieve feature flags", "error": err.Error()})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var flag types.FeatureFlag
			if err := rows.Scan(&flag.ID, &flag.KEY, &flag.DESCRIPTION, &flag.ENABLED, &flag.CREATED_AT); err != nil {
				slog.Error("Failed to scan feature flag", "error", err)
				utils.JSON(c, http.StatusInternalServerError, gin.H{"message": "Failed to retrieve feature flags", "error": err.Error()})
				return
			}
			flags = append(flags, flag)
		}

		if err := rows.Err(); err != nil {
			slog.Error("Error iterating feature flags", "error", err)
			utils.JSON(c, http.StatusInternalServerError, gin.H{"message": "Failed to retrieve feature flags", "error": err.Error()})
			return
		}

		utils.JSON(c, http.StatusOK, flags)
	}
}
