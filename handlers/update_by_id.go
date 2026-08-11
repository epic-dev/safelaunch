package handlers

import (
	"database/sql"
	"net/http"
	queries "safelaunch/db_queries"
	"safelaunch/utils"

	"github.com/gin-gonic/gin"
)

func UpdateFeatureFlag(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		type UpdateFeatureFlagInput struct {
			Key         *string `json:"key"`
			Description *string `json:"description"`
			Enabled     *bool   `json:"enabled"`
		}
		var updatedFlag UpdateFeatureFlagInput

		if err := c.BindJSON(&updatedFlag); err != nil {
			utils.JSON(c, http.StatusBadRequest, gin.H{"message": "Invalid request body - " + err.Error()})
			return
		}

		_, err := db.ExecContext(c.Request.Context(), queries.UPDATE_FEATURE_FLAG, updatedFlag.Key, updatedFlag.Description, updatedFlag.Enabled, id)
		if err != nil {
			utils.JSON(c, http.StatusInternalServerError, gin.H{"message": "Failed to update feature flag - " + err.Error()})
			return
		}
		utils.JSON(c, http.StatusOK, updatedFlag)
	}
}
