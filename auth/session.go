// Package auth holds the credential primitives shared by the API-key middleware and the
// dashboard's session endpoints.
//
// Sessions live in memory only. This is a single-binary, single-tenant server, so a restart
// logging the dashboard out is an acceptable trade for having no session table to create,
// migrate, or sweep.
package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"sync"
	"time"
)

const (
	// SessionCookieName is how the dashboard authenticates. The SDK and CLI send an
	// Authorization header instead - they have somewhere safe to keep the raw API key.
	SessionCookieName = "safelaunch_session"

	// SessionTTL is how long a dashboard session survives before the key must be re-entered.
	SessionTTL = 12 * time.Hour
)

// Store holds live dashboard sessions, keyed by token.
type Store struct {
	mu       sync.RWMutex
	sessions map[string]time.Time // token -> expiry
}

func NewStore() *Store {
	return &Store{sessions: make(map[string]time.Time)}
}

// Create mints a session token: 256 random bits, never derived from the API key, so a
// stolen cookie cannot be turned back into the key itself.
func (s *Store) Create() (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	token := base64.RawURLEncoding.EncodeToString(raw)

	s.mu.Lock()
	defer s.mu.Unlock()
	s.pruneLocked()
	s.sessions[token] = time.Now().Add(SessionTTL)

	return token, nil
}

// Valid reports whether a token is live. An expired token is dropped on the way out, which
// is why this is the only place expiry needs checking.
func (s *Store) Valid(token string) bool {
	if token == "" {
		return false
	}

	s.mu.RLock()
	expiry, found := s.sessions[token]
	s.mu.RUnlock()

	if !found {
		return false
	}
	if time.Now().After(expiry) {
		s.Revoke(token)
		return false
	}

	return true
}

// Revoke ends a session immediately - used by logout.
func (s *Store) Revoke(token string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, token)
}

// pruneLocked drops expired tokens. Called under the write lock on every Create rather than
// from a sweeper goroutine: sessions only accumulate when someone logs in, and a
// single-tenant dashboard logs in rarely.
func (s *Store) pruneLocked() {
	now := time.Now()
	for token, expiry := range s.sessions {
		if now.After(expiry) {
			delete(s.sessions, token)
		}
	}
}

// KeyMatches compares a presented key against the configured one in constant time, so the
// key cannot be recovered a byte at a time by measuring how long a rejection takes.
func KeyMatches(presented, configured string) bool {
	return subtle.ConstantTimeCompare([]byte(presented), []byte(configured)) == 1
}
