package httpapi

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/auth"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/config"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db/sqlc"
)

const validToken = "token-sesi-valid"

// gateServer runs the real routes with the gate and sessions stubbed, no database needed.
func gateServer(t *testing.T, enabled bool) (*server, *gin.Engine) {
	t.Helper()
	s, err := newServer(config.Config{GinMode: gin.TestMode, MediaDir: t.TempDir(), PublicBaseURL: "https://contoh.id"}, nil)
	if err != nil {
		t.Fatal(err)
	}
	s.gateState = newGateState(func(context.Context) (bool, error) { return enabled, nil })
	s.sessionFinder = func(_ context.Context, hash string) (sqlc.GetActiveSessionRow, error) {
		if hash == auth.HashToken(validToken) {
			// Seen just now, so requireSession does not write a touch to the database
			return sqlc.GetActiveSessionRow{Username: "uji-admin", CsrfToken: "csrf-benar", LastSeenAt: time.Now()}, nil
		}
		return sqlc.GetActiveSessionRow{}, pgx.ErrNoRows
	}
	r, err := s.routes()
	if err != nil {
		t.Fatal(err)
	}
	return s, r
}

func send(r http.Handler, method, path, cookie string, headers map[string]string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, strings.NewReader(`{"enabled":false}`))
	req.Header.Set("Content-Type", "application/json")
	if cookie != "" {
		req.AddCookie(&http.Cookie{Name: auth.CookieName, Value: cookie})
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	return rec
}

func TestGateCombinations(t *testing.T) {
	for _, tc := range []struct {
		name    string
		enabled bool
		cookie  string
		status  int
		header  string
	}{
		{"mati, tanpa sesi", false, "", http.StatusNoContent, "off"},
		{"mati, dengan sesi", false, validToken, http.StatusNoContent, "off"},
		{"aktif, tanpa sesi", true, "", http.StatusUnauthorized, "on"},
		{"aktif, sesi palsu", true, "bukan-token", http.StatusUnauthorized, "on"},
		{"aktif, sesi admin valid", true, validToken, http.StatusNoContent, "on"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			_, r := gateServer(t, tc.enabled)
			rec := send(r, http.MethodGet, "/api/gate", tc.cookie, nil)
			if rec.Code != tc.status {
				t.Fatalf("status %d, seharusnya %d", rec.Code, tc.status)
			}
			if got := rec.Header().Get(gateHeader); got != tc.header {
				t.Errorf("X-Gate %q, seharusnya %q", got, tc.header)
			}
			if got := rec.Header().Get("Cache-Control"); got != "no-store" {
				t.Errorf("Cache-Control %q", got)
			}
		})
	}
}

func TestGateFailsClosedAndRetries(t *testing.T) {
	s, _ := gateServer(t, false)
	calls := 0
	s.gateState = newGateState(func(context.Context) (bool, error) {
		calls++
		if calls == 1 {
			return false, errors.New("database mati")
		}
		return false, nil
	})
	r, _ := s.routes()
	if rec := send(r, http.MethodGet, "/api/gate", "", nil); rec.Code != http.StatusUnauthorized {
		t.Fatalf("status %d saat setting tidak terbaca, seharusnya tetap terkunci 401", rec.Code)
	}
	if rec := send(r, http.MethodGet, "/api/gate", "", nil); rec.Code != http.StatusNoContent {
		t.Fatalf("status %d, setelah database pulih gate harus dibaca ulang", rec.Code)
	}
	send(r, http.MethodGet, "/api/gate", "", nil)
	if calls != 2 {
		t.Errorf("dibaca %d kali, seharusnya sekali sesudah berhasil (cache memori)", calls)
	}
}

// The admin toggle updates memory directly, no waiting for a TTL (FR-121).
func TestGateChangeIsImmediate(t *testing.T) {
	s, r := gateServer(t, true)
	if rec := send(r, http.MethodGet, "/api/gate", "", nil); rec.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", rec.Code)
	}
	s.gateState.set(false)
	if rec := send(r, http.MethodGet, "/api/gate", "", nil); rec.Code != http.StatusNoContent {
		t.Fatalf("status %d setelah gate dimatikan", rec.Code)
	}
}

func TestPutPasswordGateNeedsSessionAndCSRF(t *testing.T) {
	_, r := gateServer(t, true)
	const path = "/api/admin/settings/password-gate"
	for _, tc := range []struct {
		name   string
		cookie string
		csrf   string
		status int
	}{
		{"tanpa sesi", "", "", http.StatusUnauthorized},
		{"sesi tanpa CSRF", validToken, "", http.StatusForbidden},
		{"sesi dengan CSRF salah", validToken, "csrf-salah", http.StatusForbidden},
	} {
		t.Run(tc.name, func(t *testing.T) {
			headers := map[string]string{}
			if tc.csrf != "" {
				headers[csrfHeader] = tc.csrf
			}
			rec := send(r, http.MethodPut, path, tc.cookie, headers)
			if rec.Code != tc.status {
				t.Fatalf("status %d, seharusnya %d", rec.Code, tc.status)
			}
		})
	}
}

func TestRobotsAndSitemapFollowGate(t *testing.T) {
	_, locked := gateServer(t, true)
	rec := send(locked, http.MethodGet, "/robots.txt", "", nil)
	if !strings.Contains(rec.Body.String(), "Disallow: /\n") || strings.Contains(rec.Body.String(), "Sitemap:") {
		t.Errorf("robots saat terkunci: %q", rec.Body.String())
	}
	if rec := send(locked, http.MethodGet, "/sitemap.xml", "", nil); rec.Code != http.StatusNotFound {
		t.Errorf("sitemap saat terkunci %d, seharusnya 404", rec.Code)
	}

	_, open := gateServer(t, false)
	rec = send(open, http.MethodGet, "/robots.txt", "", nil)
	if !strings.Contains(rec.Body.String(), "Disallow: /admin") || strings.Contains(rec.Body.String(), "Disallow: /\n") {
		t.Errorf("robots saat terbuka: %q", rec.Body.String())
	}
	if rec := send(open, http.MethodGet, "/sitemap.xml", "", nil); rec.Code != http.StatusOK {
		t.Errorf("sitemap saat terbuka %d", rec.Code)
	}
}

// FR-122: while locked, public API answers are private and not indexed.
func TestGateHeadersOnPublicAPI(t *testing.T) {
	for _, tc := range []struct {
		enabled bool
		cache   string
		robots  string
	}{
		{true, "private, no-store", "noindex"},
		{false, "public, max-age=60", ""},
	} {
		s, _ := gateServer(t, tc.enabled)
		r := gin.New()
		r.GET("/api/x", publicCache(), s.gateHeaders(), func(c *gin.Context) { c.Status(http.StatusOK) })
		rec := send(r, http.MethodGet, "/api/x", "", nil)
		if got := rec.Header().Get("Cache-Control"); got != tc.cache {
			t.Errorf("gate %v: Cache-Control %q", tc.enabled, got)
		}
		if got := rec.Header().Get("X-Robots-Tag"); got != tc.robots {
			t.Errorf("gate %v: X-Robots-Tag %q", tc.enabled, got)
		}
	}
}
