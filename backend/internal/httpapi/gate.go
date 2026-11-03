package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/auth"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db/sqlc"
)

const (
	passwordGateKey = "password_gate"
	// Read by Nginx through auth_request_set, to mark responses private while the gate is on.
	gateHeader = "X-Gate"
)

type gateValue struct {
	Enabled bool `json:"enabled"`
}

// gateState keeps the password gate in memory, because Nginx asks for every request
// (FR-121). It is loaded once and replaced the moment an admin changes it, no TTL.
type gateState struct {
	mu      sync.RWMutex
	loaded  bool
	enabled bool
	load    func(context.Context) (bool, error)
}

func newGateState(load func(context.Context) (bool, error)) *gateState {
	return &gateState{load: load}
}

// Enabled fails closed: when the setting cannot be read, the site stays locked
// and the next request tries again.
func (g *gateState) Enabled(ctx context.Context) bool {
	g.mu.RLock()
	loaded, enabled := g.loaded, g.enabled
	g.mu.RUnlock()
	if loaded {
		return enabled
	}
	enabled, err := g.load(ctx)
	if err != nil {
		slog.Error("status halaman password tidak terbaca, situs tetap terkunci", "error", err)
		return true
	}
	g.set(enabled)
	return enabled
}

func (g *gateState) set(enabled bool) {
	g.mu.Lock()
	g.loaded, g.enabled = true, enabled
	g.mu.Unlock()
}

func (s *server) loadGate(ctx context.Context) (bool, error) {
	row, err := s.q.GetSetting(ctx, passwordGateKey)
	if errors.Is(err, pgx.ErrNoRows) {
		// No row means the migration default was removed, the safe answer is locked.
		return true, nil
	}
	if err != nil {
		return true, err
	}
	var value gateValue
	if err := json.Unmarshal(row.Value, &value); err != nil {
		return true, err
	}
	return value.Enabled, nil
}

// hasSession checks the admin cookie without touching it, the gate must stay cheap.
func (s *server) hasSession(c *gin.Context) bool {
	token, err := c.Cookie(auth.CookieName)
	if err != nil || token == "" {
		return false
	}
	_, err = s.findSession(c, auth.HashToken(token))
	return err == nil
}

// checkGate answers Nginx auth_request (FR-121): 204 lets the request through, 401 shows
// the password page. An admin session opens the locked site for that browser.
func (s *server) checkGate(c *gin.Context) {
	c.Header("Cache-Control", "no-store")
	enabled := s.gateState.Enabled(c)
	if enabled {
		c.Header(gateHeader, "on")
	} else {
		c.Header(gateHeader, "off")
	}
	if !enabled || s.hasSession(c) {
		c.Status(http.StatusNoContent)
		return
	}
	c.Status(http.StatusUnauthorized)
}

// gateHeaders keeps a locked site out of every cache and index (FR-122). Placed after
// publicCache, so it replaces the public max-age while the gate is on.
func (s *server) gateHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		s.markPrivateWhileLocked(c)
		c.Next()
	}
}

func (s *server) markPrivateWhileLocked(c *gin.Context) bool {
	if !s.gateState.Enabled(c) {
		return false
	}
	c.Header("Cache-Control", "private, no-store")
	c.Header("X-Robots-Tag", "noindex")
	return true
}

type gateSetting struct {
	Enabled   bool      `json:"enabled"`
	UpdatedAt time.Time `json:"updated_at"`
	UpdatedBy *string   `json:"updated_by"`
}

func newGateSetting(row sqlc.SiteSetting) (gateSetting, error) {
	var value gateValue
	if err := json.Unmarshal(row.Value, &value); err != nil {
		return gateSetting{}, err
	}
	return gateSetting{Enabled: value.Enabled, UpdatedAt: row.UpdatedAt, UpdatedBy: row.UpdatedBy}, nil
}

func (s *server) adminGetSettings(c *gin.Context) {
	row, err := s.q.GetSetting(c, passwordGateKey)
	if err != nil {
		s.lookupError(c, err)
		return
	}
	setting, err := newGateSetting(row)
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"password_gate": setting})
}

func (s *server) adminPutPasswordGate(c *gin.Context) {
	var in struct {
		Enabled *bool `json:"enabled"`
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxJSONBody)
	if err := c.ShouldBindJSON(&in); err != nil || in.Enabled == nil {
		respondError(c, http.StatusBadRequest, codeValidation, "Kirim nilai enabled.", nil)
		return
	}
	value, _ := json.Marshal(gateValue{Enabled: *in.Enabled})
	username := sessionOf(c).Username
	row, err := s.q.SaveSetting(c, sqlc.SaveSettingParams{Key: passwordGateKey, Value: value, UpdatedBy: &username})
	if err != nil {
		s.internalError(c, err)
		return
	}
	// The cache follows the database right away, the next Nginx check already sees it.
	s.gateState.set(*in.Enabled)
	c.Set(auditEntityID, "password-gate")
	setting, err := newGateSetting(row)
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, setting)
}
