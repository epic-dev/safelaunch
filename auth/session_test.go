package auth

import (
	"testing"
	"time"
)

func TestStore_CreatedTokenIsValid(t *testing.T) {
	store := NewStore()

	token, err := store.Create()
	if err != nil {
		t.Fatalf("failed to create session: %v", err)
	}

	if !store.Valid(token) {
		t.Error("expected a freshly created token to be valid")
	}
}

func TestStore_UnknownAndEmptyTokensAreInvalid(t *testing.T) {
	store := NewStore()

	if store.Valid("") {
		t.Error("expected the empty token to be invalid")
	}
	if store.Valid("a-token-that-was-never-issued") {
		t.Error("expected an unissued token to be invalid")
	}
}

func TestStore_TokensAreUnique(t *testing.T) {
	store := NewStore()
	seen := make(map[string]bool)

	for range 100 {
		token, err := store.Create()
		if err != nil {
			t.Fatalf("failed to create session: %v", err)
		}
		if seen[token] {
			t.Fatalf("Create returned a duplicate token: %q", token)
		}
		seen[token] = true
	}
}

func TestStore_RevokeEndsTheSession(t *testing.T) {
	store := NewStore()

	token, err := store.Create()
	if err != nil {
		t.Fatalf("failed to create session: %v", err)
	}

	store.Revoke(token)

	if store.Valid(token) {
		t.Error("expected a revoked token to be invalid")
	}
}

// Expiry is enforced on read, so an expired token is rejected even though nothing swept it.
func TestStore_ExpiredTokenIsRejectedAndDropped(t *testing.T) {
	store := NewStore()

	token, err := store.Create()
	if err != nil {
		t.Fatalf("failed to create session: %v", err)
	}

	// Reach past the API to age the session, rather than waiting out SessionTTL.
	store.mu.Lock()
	store.sessions[token] = time.Now().Add(-time.Minute)
	store.mu.Unlock()

	if store.Valid(token) {
		t.Error("expected an expired token to be invalid")
	}

	store.mu.RLock()
	_, stillStored := store.sessions[token]
	store.mu.RUnlock()

	if stillStored {
		t.Error("expected the expired token to be dropped when it was read")
	}
}

func TestKeyMatches(t *testing.T) {
	cases := []struct {
		name       string
		presented  string
		configured string
		want       bool
	}{
		{"identical keys match", "super-secret", "super-secret", true},
		{"different keys do not match", "wrong-key", "super-secret", false},
		{"a prefix of the key does not match", "super", "super-secret", false},
		{"comparison is case sensitive", "SUPER-SECRET", "super-secret", false},
		{"empty presented key does not match", "", "super-secret", false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := KeyMatches(tc.presented, tc.configured); got != tc.want {
				t.Errorf("KeyMatches(%q, %q) = %v, want %v", tc.presented, tc.configured, got, tc.want)
			}
		})
	}
}
