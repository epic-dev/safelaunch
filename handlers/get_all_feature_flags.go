package handlers

import (
	"database/sql"
	"log/slog"
	"net/http"

	queries "safelaunch/db_queries"
	"safelaunch/types"
	"safelaunch/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/sync/errgroup"
)

type PaginatedResult struct {
	FeatureFlags []types.FeatureFlag `json:"featureFlags"`
	Total        int                 `json:"total"`
}

func readFeatureFlagsFromDB(c *gin.Context, db *sql.DB) (PaginatedResult, error) {
	limit := c.Query("limit")
	if limit == "" {
		limit = "10"
	}
	offset := c.Query("offset")
	if offset == "" {
		offset = "0"
	}

	var paginatedResult PaginatedResult
	g, ctx := errgroup.WithContext(c)

	g.Go(func() error {
		rows, err := db.QueryContext(ctx, queries.GET_ALL_FEATURE_FLAGS, limit, offset)
		if err != nil {
			slog.Error("Failed to query feature flags", "error", err)
			return err
		}
		defer rows.Close()

		featureFlags := []types.FeatureFlag{}
		for rows.Next() {
			var flag types.FeatureFlag
			if err := rows.Scan(&flag.ID, &flag.KEY, &flag.DESCRIPTION, &flag.ENABLED, &flag.CREATED_AT); err != nil {
				slog.Error("Failed to scan feature flag", "error", err)
				return err
			}
			featureFlags = append(featureFlags, flag)
		}
		if err := rows.Err(); err != nil {
			slog.Error("Error occurred while iterating through rows", "error", err)
			return err
		}

		paginatedResult.FeatureFlags = featureFlags
		return nil
	})

	g.Go(func() error {
		row := db.QueryRowContext(ctx, queries.GET_FEATURE_FLAG_COUNT)
		var total int
		if err := row.Scan(&total); err != nil {
			slog.Error("Failed to get feature flag count", "error", err)
			return err
		}

		paginatedResult.Total = total
		return nil
	})

	if err := g.Wait(); err != nil {
		return PaginatedResult{}, err
	}
	return paginatedResult, nil
}

func GetAllFeatureFlags(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		paginatedResult, err := readFeatureFlagsFromDB(c, db)
		if err != nil {
			slog.Error("Failed to retrieve feature flags", "error", err)
			utils.JSON(c, http.StatusInternalServerError, gin.H{"message": "Failed to retrieve feature flags", "error": err.Error()})
			return
		}

		utils.JSON(c, http.StatusOK, paginatedResult)
	}
}
