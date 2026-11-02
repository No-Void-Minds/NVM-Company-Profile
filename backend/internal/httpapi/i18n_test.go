package httpapi

import (
	"encoding/xml"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/config"
)

func TestLangQuery(t *testing.T) {
	for _, tc := range []struct {
		query string
		lang  string
		ok    bool
	}{
		{"", "id", true},
		{"?lang=id", "id", true},
		{"?lang=en", "en", true},
		{"?lang=fr", "", false},
	} {
		rec := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rec)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/techs"+tc.query, nil)
		lang, ok := langQuery(c)
		if lang != tc.lang || ok != tc.ok {
			t.Errorf("%q: dapat %q %v", tc.query, lang, ok)
		}
		if !tc.ok && rec.Code != http.StatusBadRequest {
			t.Errorf("%q: status %d, seharusnya 400", tc.query, rec.Code)
		}
	}
}

// FR-117: both languages in the sitemap, each listing id, en, and x-default.
func TestSitemapHasBothLanguages(t *testing.T) {
	s := &server{cfg: config.Config{PublicBaseURL: "https://contoh.id"}}
	body, err := xml.Marshal(s.sitemapSet())
	if err != nil {
		t.Fatal(err)
	}
	text := string(body)
	if got := strings.Count(text, "<url>"); got != 2*len(publicRoutes) {
		t.Fatalf("ada %d url, seharusnya %d", got, 2*len(publicRoutes))
	}
	for _, want := range []string{
		`xmlns:xhtml="http://www.w3.org/1999/xhtml"`,
		"<loc>https://contoh.id/</loc>",
		"<loc>https://contoh.id/en</loc>",
		"<loc>https://contoh.id/en/teknologi</loc>",
		`<xhtml:link rel="alternate" hreflang="en" href="https://contoh.id/en/teknologi">`,
		`<xhtml:link rel="alternate" hreflang="x-default" href="https://contoh.id/teknologi">`,
	} {
		if !strings.Contains(text, want) {
			t.Errorf("sitemap tidak memuat %s", want)
		}
	}
}
