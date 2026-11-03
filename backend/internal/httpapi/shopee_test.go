package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/auth"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/content"
)

func ptr(s string) *string { return &s }

func TestValidateTechLinks(t *testing.T) {
	fits := []string{"Regular", "Fitted", "Polo"}
	kept, fields := validateTechLinks(fits, []content.TechLink{
		{Fit: ptr("Regular"), URL: "https://shopee.co.id/a"},
		{Fit: ptr("Fitted"), URL: ""},
		{Fit: ptr("Polo"), URL: "https://shopee.co.id/b?shopCollection=1"},
	})
	if len(fields) != 0 || len(kept) != 2 {
		t.Fatalf("link sah harus lolos dan link kosong dibuang: kept %d, fields %v", len(kept), fields)
	}
	if kept[1].URL != "https://shopee.co.id/b?shopCollection=1" {
		t.Errorf("query harus disimpan apa adanya, dapat %q", kept[1].URL)
	}

	_, fields = validateTechLinks(fits, []content.TechLink{
		{Fit: nil, URL: "https://shopee.co.id/a"},
		{Fit: ptr("Boxy"), URL: "https://shopee.co.id/a"},
		{Fit: ptr("Regular"), URL: "https://shopee.co.id.evil.com/a"},
		{Fit: ptr("Polo"), URL: "https://shopee.co.id/a"},
		{Fit: ptr("Polo"), URL: "https://shopee.co.id/b"},
	})
	for _, field := range []string{"links", "links.Boxy", "links.Regular", "links.Polo"} {
		if fields[field] == "" {
			t.Errorf("%s harus ditolak, fields %v", field, fields)
		}
	}

	// A tech without fits takes exactly one link without a fit
	kept, fields = validateTechLinks(nil, []content.TechLink{{Fit: nil, URL: "https://shopee.co.id/c"}})
	if len(fields) != 0 || len(kept) != 1 {
		t.Errorf("link tanpa fit harus lolos: %v", fields)
	}
	if _, fields = validateTechLinks(nil, []content.TechLink{{Fit: ptr("Regular"), URL: "https://shopee.co.id/c"}}); fields["links.Regular"] == "" {
		t.Error("fit pada tech tanpa fit harus ditolak")
	}
}

// Rejected before any database work, so the stubbed server is enough.
func TestPatchCollabRejectsForeignLinks(t *testing.T) {
	_, r := gateServer(t, false)
	for _, url := range []string{
		"javascript:alert(1)",
		"http://shopee.co.id/novoidminds",
		"https://shopee.co.id.evil.com/x",
		"https://shopee.co.id@evil.com/x",
		"https://evil.com/?u=https://shopee.co.id",
	} {
		body, _ := json.Marshal(map[string]string{"url": url})
		req := httptest.NewRequest(http.MethodPatch, "/api/admin/collabs/marvel", strings.NewReader(string(body)))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set(csrfHeader, "csrf-benar")
		req.AddCookie(&http.Cookie{Name: auth.CookieName, Value: validToken})
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Errorf("%q: status %d, seharusnya 400", url, rec.Code)
			continue
		}
		if !strings.Contains(rec.Body.String(), `"url"`) {
			t.Errorf("%q: field url tidak disebut: %s", url, rec.Body.String())
		}
		if got := rec.Header().Get("Cache-Control"); got != "no-store" {
			t.Errorf("%q: Cache-Control %q", url, got)
		}
	}
}
