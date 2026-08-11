package handlers

import (
	"database/sql"
	"encoding/json"
	"io"
	"net/http"

	queries "safelaunch/db_queries"
	"safelaunch/types"

	"github.com/gin-gonic/gin"
	"github.com/goccy/go-yaml"
)

func ImportFeatureFlags(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		file, err := c.FormFile("file")
		if err != nil {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"message": "Failed to get uploaded file"})
			return
		}

		f, err := file.Open()
		if err != nil {
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"message": "Failed to open uploaded file"})
			return
		}
		defer f.Close()

		var featureFlags []types.FeatureFlag
		fileBytes, err := io.ReadAll(f)
		if err != nil {
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"message": "Failed to read uploaded file"})
			return
		}

		if err := json.Unmarshal(fileBytes, &featureFlags); err != nil {
			if err := yaml.Unmarshal(fileBytes, &featureFlags); err != nil {
				c.IndentedJSON(http.StatusBadRequest, gin.H{"message": "File is not valid JSON or YAML"})
				return
			}
		}

		tx, err := db.BeginTx(c.Request.Context(), nil)
		if err != nil {
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"message": "Failed to begin transaction"})
			return
		}

		for _, flag := range featureFlags {
			_, err := tx.ExecContext(c.Request.Context(), queries.INSERT_FEATURE_FLAG, flag.KEY, flag.DESCRIPTION, flag.ENABLED)
			if err != nil {
				tx.Rollback()
				c.IndentedJSON(http.StatusInternalServerError, gin.H{"message": "Failed to insert feature flag", "error": err.Error()})
				return
			}
		}

		if err := tx.Commit(); err != nil {
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"message": "Failed to commit transaction"})
			return
		}

		c.IndentedJSON(http.StatusOK, gin.H{"message": "Feature flags uploaded successfully"})
	}
}
