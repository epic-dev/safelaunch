package handlers

import (
	"database/sql"
	"net/http"

	queries "safelaunch/db_queries"
	"safelaunch/types"

	"github.com/gin-gonic/gin"
)

func CreateFeatureFlag(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			Key         string `json:"key"`
			Description string `json:"description"`
			Enabled     bool   `json:"enabled"`
		}

		if err := c.BindJSON(&input); err != nil {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"message": "Invalid request body - " + err.Error()})
			return
		}

		res, err := db.ExecContext(c.Request.Context(), queries.INSERT_FEATURE_FLAG, input.Key, input.Description, input.Enabled)
		if err != nil {
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"message": "Failed to create feature flag", "input": input, "error": err.Error()})
			return
		}

		createdFlagId, err := res.LastInsertId()
		if err != nil {
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"message": "Failed to retrieve inserted ID"})
			return
		}

		var newFlag types.FeatureFlag
		row := db.QueryRowContext(c.Request.Context(), queries.GET_FEATURE_FLAG_BY_ID, createdFlagId)
		if err := row.Scan(&newFlag.ID, &newFlag.KEY, &newFlag.DESCRIPTION, &newFlag.ENABLED, &newFlag.CREATED_AT); err != nil {
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"message": "Failed to retrieve inserted flag", "ID": createdFlagId, "error": err.Error()})
			return
		}

		c.IndentedJSON(http.StatusCreated, newFlag)
	}
}
