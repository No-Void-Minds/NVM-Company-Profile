package httpapi

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/config"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db/sqlc"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// BR-02 is checked before any upload or query, so a server with no database is enough.
func TestCreateTestimonialPublishedWithoutBlurIsConflict(t *testing.T) {
	var body bytes.Buffer
	form := multipart.NewWriter(&body)
	for name, value := range map[string]string{
		"source":            "shopee",
		"review_date":       "2026-11-02",
		"transcript":        "UJI transkrip",
		"blurred_confirmed": "false",
		"published":         "true",
	} {
		_ = form.WriteField(name, value)
	}
	_ = form.Close()

	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/admin/testimonials", &body)
	c.Request.Header.Set("Content-Type", form.FormDataContentType())

	(&server{}).adminCreateTestimonial(c)

	if rec.Code != http.StatusConflict {
		t.Fatalf("status %d, seharusnya 409: %s", rec.Code, rec.Body)
	}
	var parsed struct {
		Error errorBody `json:"error"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &parsed); err != nil {
		t.Fatal(err)
	}
	if parsed.Error.Code != codeConflict || parsed.Error.Fields["blurred_confirmed"] == "" {
		t.Fatalf("isi error salah: %+v", parsed.Error)
	}
}

func TestRequireCSRF(t *testing.T) {
	cases := []struct {
		name   string
		header string
		status int
	}{
		{"token benar", "token-sesi", http.StatusOK},
		{"token salah", "token-lain", http.StatusForbidden},
		{"tanpa token", "", http.StatusForbidden},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(rec)
			c.Request = httptest.NewRequest(http.MethodPost, "/", nil)
			if tc.header != "" {
				c.Request.Header.Set(csrfHeader, tc.header)
			}
			c.Set(sessionKey, sqlc.GetActiveSessionRow{CsrfToken: "token-sesi"})

			requireCSRF(c)

			if c.IsAborted() != (tc.status != http.StatusOK) {
				t.Fatalf("abort salah: %v", c.IsAborted())
			}
			if tc.status != http.StatusOK && rec.Code != tc.status {
				t.Fatalf("status %d, seharusnya %d", rec.Code, tc.status)
			}
		})
	}
}

// A 200 from the admin group is the case respondError cannot cover on its own.
func TestAdminGroupIsNoStore(t *testing.T) {
	r := gin.New()
	adminGroup(r.Group("/api")).GET("/techs", func(c *gin.Context) {
		c.JSON(http.StatusOK, []string{})
	})
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/admin/techs", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	if got := rec.Header().Get("Cache-Control"); got != "no-store" {
		t.Fatalf("Cache-Control %q", got)
	}
}

// Routes that answer without a database, through the real router.
func TestAdminRoutesAreNoStore(t *testing.T) {
	r, err := NewRouter(config.Config{GinMode: gin.TestMode, MediaDir: t.TempDir()}, nil)
	if err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct{ method, path string }{
		{http.MethodPost, "/api/admin/login"},
		{http.MethodGet, "/api/admin/me"},
		{http.MethodGet, "/api/admin/techs"},
		{http.MethodGet, "/api/admin/collabs"},
		{http.MethodPatch, "/api/admin/techs/therco"},
	} {
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, httptest.NewRequest(tc.method, tc.path, nil))
		if rec.Code == http.StatusNotFound {
			t.Errorf("%s %s tidak terdaftar", tc.method, tc.path)
		}
		if got := rec.Header().Get("Cache-Control"); got != "no-store" {
			t.Errorf("%s %s: Cache-Control %q", tc.method, tc.path, got)
		}
	}
}

func TestErrorResponseIsNotCacheable(t *testing.T) {
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Header("Cache-Control", "public, max-age=60")
	respondError(c, http.StatusNotFound, codeNotFound, "x", nil)
	if got := rec.Header().Get("Cache-Control"); got != "no-store" {
		t.Fatalf("Cache-Control %q", got)
	}
}
