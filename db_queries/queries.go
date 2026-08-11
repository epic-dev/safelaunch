package queries

const INITIALIZE_DATABASE = `
CREATE TABLE IF NOT EXISTS feature_flags (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	key TEXT UNIQUE NOT NULL,
	description TEXT,
	enabled BOOLEAN NOT NULL DEFAULT FALSE,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`

/**
 * It's not anticipated that the feature_flags table will have more than 1000 rows,
 * so we can use a COUNT(*) query to get the total number of rows in the table.
 */
const GET_FEATURE_FLAG_COUNT = `
SELECT COUNT(*) FROM feature_flags`

const GET_ALL_FEATURE_FLAGS = `
SELECT id, key, description, enabled, created_at FROM feature_flags ORDER BY id LIMIT ? OFFSET ?`

const GET_FEATURE_FLAG_BY_KEY = `
SELECT id, key, description, enabled, created_at FROM feature_flags WHERE key = ?`

const GET_FEATURE_FLAG_BY_ID = `
SELECT id, key, description, enabled, created_at FROM feature_flags WHERE id = ?`

const UPDATE_FEATURE_FLAG = `
UPDATE feature_flags 
SET 
	key = COALESCE(?, key), 
	description = COALESCE(?, description), 
	enabled = COALESCE(?, enabled) 
WHERE id = ?`

const INSERT_FEATURE_FLAG = `
INSERT INTO feature_flags (key, description, enabled) VALUES (?, ?, ?)`

const DELETE_FEATURE_FLAG = `
DELETE FROM feature_flags WHERE id = ?`
