package types

type FeatureFlag struct {
	ID          int    `json:"id"`
	KEY         string `json:"key"`
	DESCRIPTION string `json:"description"`
	ENABLED     bool   `json:"enabled"`
	CREATED_AT  string `json:"created_at"`
}
