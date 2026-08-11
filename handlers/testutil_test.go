package handlers

import (
	"database/sql"
	"testing"

	queries "safelaunch/db_queries"

	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// newTestDB returns a fresh, schema-initialized in-memory SQLite DB for a single test.
// MaxOpenConns is pinned to 1 because each new connection to ":memory:" gets its own
// empty database - without this, database/sql's connection pool can silently hand out
// a second, unrelated in-memory DB mid-test.
func newTestDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("failed to open in-memory test db: %v", err)
	}
	db.SetMaxOpenConns(1)
	t.Cleanup(func() { db.Close() })

	if _, err := db.Exec(queries.INITIALIZE_DATABASE); err != nil {
		t.Fatalf("failed to initialize schema: %v", err)
	}

	return db
}

// seedFlag inserts a feature flag directly and returns its id, for tests that need
// an existing row without going through the CreateFeatureFlag handler.
func seedFlag(t *testing.T, db *sql.DB, key, description string, enabled bool) int64 {
	t.Helper()

	res, err := db.Exec(queries.INSERT_FEATURE_FLAG, key, description, enabled)
	if err != nil {
		t.Fatalf("failed to seed flag %q: %v", key, err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		t.Fatalf("failed to read seeded flag id: %v", err)
	}
	return id
}
