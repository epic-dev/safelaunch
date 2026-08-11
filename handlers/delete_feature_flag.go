package handlers

import (
	"database/sql"
	"net/http"
	queries "safelaunch/db_queries"
	"safelaunch/utils"

	"github.com/gin-gonic/gin"
)

func DeleteFeatureFlag(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		_, err := db.ExecContext(c.Request.Context(), queries.DELETE_FEATURE_FLAG, id)
		if err != nil {
			utils.JSON(c, http.StatusInternalServerError, gin.H{"message": "Failed to delete feature flag"})
			return
		}
		utils.JSON(c, http.StatusNoContent, gin.H{"message": "Feature flag deleted successfully"})
	}
}
