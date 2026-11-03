package httpapi

import (
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/auth"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db/sqlc"
)

const (
	sessionKey       = "session"
	csrfHeader       = "X-CSRF-Token"
	maxLoginBody     = 4 << 10
	sessionTouchStep = time.Minute
)

func (s *server) setSessionCookie(c *gin.Context, token string, maxAge time.Duration) {
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     auth.CookieName,
		Value:    token,
		Path:     "/",
		MaxAge:   int(maxAge.Seconds()),
		HttpOnly: true,
		Secure:   s.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
}

func (s *server) login(c *gin.Context) {
	if !s.loginLimit.Allow(c.ClientIP()) {
		respondError(c, http.StatusTooManyRequests, codeRateLimited, "Terlalu banyak percobaan masuk. Coba lagi 15 menit lagi.", nil)
		return
	}

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxLoginBody)
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, codeValidation, "Isi username dan password.", nil)
		return
	}

	user, err := s.q.GetAdminUserByUsername(c, body.Username)
	switch {
	case errors.Is(err, pgx.ErrNoRows):
		auth.BurnVerify(body.Password)
		respondError(c, http.StatusUnauthorized, codeUnauthorized, "Username atau password salah.", nil)
		return
	case err != nil:
		s.internalError(c, err)
		return
	}
	ok, err := auth.VerifyPassword(body.Password, user.PasswordHash)
	if err != nil {
		s.internalError(c, err)
		return
	}
	if !ok {
		respondError(c, http.StatusUnauthorized, codeUnauthorized, "Username atau password salah.", nil)
		return
	}

	token, err := auth.NewToken()
	if err != nil {
		s.internalError(c, err)
		return
	}
	csrf, err := auth.NewToken()
	if err != nil {
		s.internalError(c, err)
		return
	}
	if err := s.q.DeleteExpiredSessions(c); err != nil {
		slog.Warn("gagal membersihkan sesi lama", "error", err)
	}
	if err := s.q.CreateSession(c, sqlc.CreateSessionParams{
		ID:        auth.HashToken(token),
		UserID:    user.ID,
		CsrfToken: csrf,
		ExpiresAt: time.Now().Add(auth.IdleTimeout),
	}); err != nil {
		s.internalError(c, err)
		return
	}
	if err := s.q.TouchAdminLogin(c, user.ID); err != nil {
		slog.Warn("gagal mencatat waktu login", "error", err)
	}

	s.setSessionCookie(c, token, auth.IdleTimeout)
	c.JSON(http.StatusOK, gin.H{"username": user.Username, "csrf_token": csrf})
}

func (s *server) logout(c *gin.Context) {
	if err := s.q.DeleteSession(c, sessionOf(c).ID); err != nil {
		s.internalError(c, err)
		return
	}
	s.setSessionCookie(c, "", -time.Second)
	c.Status(http.StatusNoContent)
}

func (s *server) me(c *gin.Context) {
	session := sessionOf(c)
	c.JSON(http.StatusOK, gin.H{"username": session.Username, "csrf_token": session.CsrfToken})
}

func sessionOf(c *gin.Context) sqlc.GetActiveSessionRow {
	return c.MustGet(sessionKey).(sqlc.GetActiveSessionRow)
}

func (s *server) requireSession(c *gin.Context) {
	token, err := c.Cookie(auth.CookieName)
	if err != nil || token == "" {
		respondError(c, http.StatusUnauthorized, codeUnauthorized, "Silakan masuk dulu.", nil)
		return
	}
	session, err := s.findSession(c, auth.HashToken(token))
	if errors.Is(err, pgx.ErrNoRows) {
		respondError(c, http.StatusUnauthorized, codeUnauthorized, "Sesi sudah berakhir. Silakan masuk lagi.", nil)
		return
	}
	if err != nil {
		s.internalError(c, err)
		return
	}

	// Writing on every request is wasteful, a minute of slack on 8 hours is harmless.
	if time.Since(session.LastSeenAt) > sessionTouchStep {
		if err := s.q.TouchSession(c, sqlc.TouchSessionParams{
			ID:        session.ID,
			ExpiresAt: time.Now().Add(auth.IdleTimeout),
		}); err != nil {
			slog.Warn("gagal memperbarui sesi", "error", err)
		}
		s.setSessionCookie(c, token, auth.IdleTimeout)
	}

	c.Set(sessionKey, session)
	c.Next()
}

func requireCSRF(c *gin.Context) {
	if !auth.TokensEqual(c.GetHeader(csrfHeader), sessionOf(c).CsrfToken) {
		respondError(c, http.StatusForbidden, codeForbidden, "Token keamanan tidak cocok. Muat ulang halaman lalu coba lagi.", nil)
		return
	}
	c.Next()
}
