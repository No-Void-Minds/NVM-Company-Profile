package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"reflect"
	"regexp"
	"slices"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/getkin/kin-openapi/openapi3filter"
	"github.com/getkin/kin-openapi/routers"
	"github.com/getkin/kin-openapi/routers/legacy"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/auth"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/config"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db/sqlc"
)

const docsDir = "../../../docs"

var (
	specOnce   sync.Once
	specDoc    *openapi3.T
	specRouter routers.Router
	specErr    error
)

func init() {
	// Bodies that are only checked to be strings. kin-openapi has no decoder for most of these,
	// and its CSV decoder expects commas while the export uses semicolons for Excel.
	for _, ct := range []string{"text/csv", "application/xml", "image/webp", "text/html", "text/css", "text/javascript",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"} {
		openapi3filter.RegisterBodyDecoder(ct, openapi3filter.FileBodyDecoder)
	}
}

// loadSpec fails the test when openapi.yaml does not load or is not a valid OpenAPI 3.1 document.
func loadSpec(t *testing.T) (*openapi3.T, routers.Router) {
	t.Helper()
	specOnce.Do(func() {
		specDoc, specErr = openapi3.NewLoader().LoadFromFile(filepath.Join(docsDir, "openapi.yaml"))
		if specErr != nil {
			return
		}
		if specErr = specDoc.Validate(context.Background()); specErr != nil {
			return
		}
		// Test requests go to example.com, so routes are matched on the path alone
		routed := *specDoc
		routed.Servers = nil
		specRouter, specErr = legacy.NewRouter(&routed)
	})
	if specErr != nil {
		t.Fatalf("openapi.yaml: %v", specErr)
	}
	return specDoc, specRouter
}

// validated checks every response of h against openapi.yaml, so the router tests also guard the spec.
func validated(t *testing.T, h http.Handler) http.Handler {
	t.Helper()
	_, router := loadSpec(t)
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		checkResponse(t, router, req, rec)
		for k, v := range rec.Header() {
			w.Header()[k] = v
		}
		w.WriteHeader(rec.Code)
		_, _ = w.Write(rec.Body.Bytes())
	})
}

func checkResponse(t *testing.T, router routers.Router, req *http.Request, rec *httptest.ResponseRecorder) {
	t.Helper()
	route, params, err := router.FindRoute(req)
	if err != nil {
		t.Errorf("%s %s tidak ada di openapi.yaml: %v", req.Method, req.URL.Path, err)
		return
	}
	err = openapi3filter.ValidateResponse(context.Background(), &openapi3filter.ResponseValidationInput{
		RequestValidationInput: &openapi3filter.RequestValidationInput{Request: req, PathParams: params, Route: route},
		Status:                 rec.Code,
		Header:                 rec.Header(),
		Body:                   io.NopCloser(bytes.NewReader(rec.Body.Bytes())),
		Options:                &openapi3filter.Options{IncludeResponseStatus: true, MultiError: true},
	})
	if err != nil {
		t.Errorf("%s %s %d tidak cocok dengan openapi.yaml: %v\nbody: %.300s", req.Method, req.URL, rec.Code, err, rec.Body)
	}
}

var ginParam = regexp.MustCompile(`:(\w+)`)

// silenceGin hides the route listing that debug mode prints, and puts test mode back afterwards.
func silenceGin(t *testing.T) {
	writer := gin.DefaultWriter
	gin.DefaultWriter = io.Discard
	t.Cleanup(func() {
		gin.DefaultWriter = writer
		gin.SetMode(gin.TestMode)
	})
}

func TestOpenAPIListsEveryRoute(t *testing.T) {
	doc, _ := loadSpec(t)
	silenceGin(t)
	// Debug mode, so the dev-only docs routes are compared as well
	r, err := NewRouter(config.Config{GinMode: gin.DebugMode, MediaDir: t.TempDir()}, nil)
	if err != nil {
		t.Fatal(err)
	}
	inRouter := map[string]bool{}
	for _, route := range r.Routes() {
		inRouter[route.Method+" "+ginParam.ReplaceAllString(route.Path, "{$1}")] = true
	}
	inSpec := map[string]bool{}
	for path, item := range doc.Paths.Map() {
		for method := range item.Operations() {
			inSpec[method+" "+path] = true
		}
	}
	for _, route := range slices.Sorted(mapKeys(inRouter)) {
		if !inSpec[route] {
			t.Errorf("route %s ada di router tetapi tidak di openapi.yaml", route)
		}
	}
	for _, route := range slices.Sorted(mapKeys(inSpec)) {
		if !inRouter[route] {
			t.Errorf("route %s ada di openapi.yaml tetapi tidak di router", route)
		}
	}
}

func mapKeys(m map[string]bool) func(func(string) bool) {
	return func(yield func(string) bool) {
		for k := range m {
			if !yield(k) {
				return
			}
		}
	}
}

func docsRouter(t *testing.T, mode string) http.Handler {
	t.Helper()
	silenceGin(t)
	r, err := NewRouter(config.Config{GinMode: mode, MediaDir: t.TempDir(), DocsDir: docsDir}, nil)
	if err != nil {
		t.Fatal(err)
	}
	return r
}

// Production runs in release mode, where the docs routes must not exist at all.
func TestDocsAreNotRegisteredInRelease(t *testing.T) {
	r := docsRouter(t, gin.ReleaseMode)
	for _, path := range []string{"/api/docs", "/api/docs/openapi.yaml", "/api/docs/swagger-ui-bundle.js"} {
		rec := send(r, http.MethodGet, path, "", nil)
		if rec.Code != http.StatusNotFound || !strings.Contains(rec.Body.String(), codeNotFound) {
			t.Errorf("%s di release: %d %s", path, rec.Code, rec.Body)
		}
	}
}

func TestDocsServedInDebug(t *testing.T) {
	r := validated(t, docsRouter(t, gin.DebugMode))
	for _, path := range []string{"/api/docs", "/api/docs/openapi.yaml", "/api/docs/swagger-ui.css",
		"/api/docs/swagger-ui-bundle.js", "/api/docs/swagger-init.js"} {
		rec := send(r, http.MethodGet, path, "", nil)
		if rec.Code != http.StatusOK {
			t.Errorf("%s: %d", path, rec.Code)
		}
		if csp := rec.Header().Get("Content-Security-Policy"); !strings.Contains(csp, "script-src 'self'") {
			t.Errorf("%s: CSP %q", path, csp)
		}
	}
	// Only the listed files, nothing else from the docs folder
	if rec := send(r, http.MethodGet, "/api/docs/sprint.md", "", nil); rec.Code != http.StatusNotFound {
		t.Errorf("file di luar daftar: %d", rec.Code)
	}
}

// fakeDB answers sqlc queries from fixed rows, keyed by the query name in the generated SQL.
// Rows are structs in sqlc scan order, or a single value for one-column queries.
type fakeDB map[string][]any

func queryName(sql string) string {
	return strings.Fields(sql)[2]
}

func (f fakeDB) Exec(context.Context, string, ...any) (pgconn.CommandTag, error) {
	return pgconn.NewCommandTag("DELETE 1"), nil
}

func (f fakeDB) Query(_ context.Context, sql string, _ ...any) (pgx.Rows, error) {
	return &fakeRows{items: f[queryName(sql)], at: -1}, nil
}

// QueryRow returns the struct row whose first column equals one of the arguments. Queries
// without arguments and one-column rows (a RETURNING code) get the first row.
func (f fakeDB) QueryRow(_ context.Context, sql string, args ...any) pgx.Row {
	for _, item := range f[queryName(sql)] {
		if len(args) == 0 || reflect.ValueOf(item).Kind() != reflect.Struct || slices.Contains(args, firstColumn(item)) {
			return fakeRow{item}
		}
	}
	return fakeRow{nil}
}

func firstColumn(item any) any {
	return reflect.ValueOf(item).Field(0).Interface()
}

type fakeRow struct{ item any }

func (r fakeRow) Scan(dest ...any) error {
	if r.item == nil {
		return pgx.ErrNoRows
	}
	v := reflect.ValueOf(r.item)
	if v.Kind() != reflect.Struct {
		reflect.ValueOf(dest[0]).Elem().Set(v)
		return nil
	}
	for i := range dest {
		reflect.ValueOf(dest[i]).Elem().Set(v.Field(i))
	}
	return nil
}

// fakeRows embeds the interface for the methods sqlc never calls.
type fakeRows struct {
	pgx.Rows
	items []any
	at    int
}

func (r *fakeRows) Close()                 {}
func (r *fakeRows) Err() error             { return nil }
func (r *fakeRows) Next() bool             { r.at++; return r.at < len(r.items) }
func (r *fakeRows) Scan(dest ...any) error { return fakeRow{r.items[r.at]}.Scan(dest...) }

func readSeed(t *testing.T, name string, v any) {
	t.Helper()
	data, err := os.ReadFile(filepath.Join("..", "db", "seed", name))
	if err != nil {
		t.Fatal(err)
	}
	if err := json.Unmarshal(data, v); err != nil {
		t.Fatalf("%s: %v", name, err)
	}
}

// seedDB holds the seed techs, links, collabs, and size chart. Gallery, testimonials, and
// inquiries have no seed, so they get one row of clearly marked test data.
func seedDB(t *testing.T) fakeDB {
	t.Helper()
	var techs []sqlc.ListTechsByLangRow
	var links []sqlc.TechLink
	var collabs []sqlc.Collab
	var charts []sqlc.SizeChart
	readSeed(t, "techs.json", &techs)
	readSeed(t, "tech_links.json", &links)
	readSeed(t, "collabs.json", &collabs)
	readSeed(t, "sizecharts.json", &charts)

	now := time.Now()
	db := fakeDB{
		"GetLabStats":   {sqlc.GetLabStatsRow{Systems: 10, OnRack: 0}},
		"CreateInquiry": {"B2B-TEST00"},
		"GetSetting":    {sqlc.SiteSetting{Key: passwordGateKey, Value: []byte(`{"enabled":false}`), UpdatedAt: now}},
		"SaveSetting":   {sqlc.SiteSetting{Key: passwordGateKey, Value: []byte(`{"enabled":true}`), UpdatedAt: now}},
		"ListAuditLog":  {sqlc.ListAuditLogRow{ID: 1, Action: "update", Entity: "techs", EntityID: "aezy", At: now}},
		"ListInquiries": {testInquiry(now)},
		"GetInquiry":    {testInquiry(now)},
	}
	db["SetInquiryStatus"] = db["GetInquiry"]
	for _, tech := range techs {
		db["ListTechsByLang"] = append(db["ListTechsByLang"], tech)
	}
	for _, link := range links {
		db["ListTechLinks"] = append(db["ListTechLinks"], link)
	}
	for _, collab := range collabs {
		db["ListCollabs"] = append(db["ListCollabs"], collab)
	}
	db["UpdateCollab"] = db["ListCollabs"]
	for _, chart := range charts {
		chart.UpdatedAt = now
		db["GetSizeChart"] = append(db["GetSizeChart"], chart)
	}
	db["ListSizeCharts"] = db["GetSizeChart"]
	db["UpsertSizeChart"] = db["GetSizeChart"]

	tech, rating := "aezy", int16(5)
	gallery := sqlc.GalleryItem{ID: uuid.New(), Category: "uji", Alt: "UJI alt", ImageKey: uuid.New(),
		Width: 1600, Height: 1200, Visible: true, CreatedAt: now}
	testimonial := sqlc.Testimonial{ID: uuid.New(), Source: "shopee", ReviewDate: now, TechKey: &tech, Rating: &rating,
		Transcript: "UJI transkrip", ImageKey: uuid.New(), Width: 1080, Height: 1920, Published: true, CreatedAt: now, Lang: "id"}
	db["ListVisibleGallery"] = []any{gallery}
	db["ListAllGallery"] = []any{gallery}
	db["ListPublishedTestimonials"] = []any{testimonial}
	db["ListAllTestimonials"] = []any{testimonial}
	return db
}

var testInquiryID = uuid.MustParse("00000000-0000-4000-8000-000000000001")

func testInquiry(now time.Time) sqlc.Inquiry {
	return sqlc.Inquiry{ID: testInquiryID, Code: "B2B-TEST00", Kind: "wholesale", Name: "UJI Nama", Org: "UJI Usaha",
		City: "Bandung", Phone: "081234567890", Techs: []string{"aezy"}, Message: "UJI pesan inquiry",
		ConsentAt: now, Status: "new", CreatedAt: now}
}

func fakeServer(t *testing.T, db fakeDB) http.Handler {
	t.Helper()
	s, err := newServer(config.Config{GinMode: gin.TestMode, MediaDir: t.TempDir(), BrandEstYear: 2021,
		IPHashSalt: "uji", PublicBaseURL: "https://novoidminds.id"}, nil)
	if err != nil {
		t.Fatal(err)
	}
	s.q = sqlc.New(db)
	s.gateState = newGateState(func(context.Context) (bool, error) { return false, nil })
	stubSessions(s)
	r, err := s.routes()
	if err != nil {
		t.Fatal(err)
	}
	return validated(t, r)
}

type specCase struct {
	method, path, body string
	headers            map[string]string
	admin              bool
	want               int
}

func run(t *testing.T, r http.Handler, tc specCase) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(tc.method, tc.path, strings.NewReader(tc.body))
	req.Header.Set("Content-Type", "application/json")
	if tc.admin {
		req.AddCookie(&http.Cookie{Name: auth.CookieName, Value: validToken})
		req.Header.Set(csrfHeader, "csrf-benar")
	}
	for k, v := range tc.headers {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != tc.want {
		t.Errorf("%s %s: %d, seharusnya %d: %.300s", tc.method, tc.path, rec.Code, tc.want, rec.Body)
	}
	return rec
}

const validInquiry = `{"kind":"wholesale","name":"UJI Nama","org":"UJI Usaha","city":"Bandung",
	"phone":"0812-3456-7890","techs":["aezy"],"message":"UJI pesan inquiry","consent":true}`

// The real public handlers on seed data, checked against the spec by validated.
func TestPublicResponsesMatchSpec(t *testing.T) {
	r := fakeServer(t, seedDB(t))
	for _, tc := range []specCase{
		{method: http.MethodGet, path: "/api/techs", want: http.StatusOK},
		{method: http.MethodGet, path: "/api/techs?lang=en", want: http.StatusOK},
		{method: http.MethodGet, path: "/api/techs?lang=fr", want: http.StatusBadRequest},
		{method: http.MethodGet, path: "/api/collabs", want: http.StatusOK},
		{method: http.MethodGet, path: "/api/lab-stats", want: http.StatusOK},
		{method: http.MethodGet, path: "/api/gallery?lang=en", want: http.StatusOK},
		{method: http.MethodGet, path: "/api/gallery?lang=fr", want: http.StatusBadRequest},
		{method: http.MethodGet, path: "/api/testimonials?source=shopee", want: http.StatusOK},
		{method: http.MethodGet, path: "/api/size-charts/aezy-regular", want: http.StatusOK},
		{method: http.MethodGet, path: "/api/size-charts/aezy-fitted", want: http.StatusNotFound},
		{method: http.MethodGet, path: "/sitemap.xml", want: http.StatusOK},
		{method: http.MethodGet, path: "/robots.txt", want: http.StatusOK},
		{method: http.MethodGet, path: "/api/gate", want: http.StatusNoContent},
		{method: http.MethodGet, path: "/media/bukan-gambar.webp", want: http.StatusNotFound},
	} {
		run(t, r, tc)
	}

	rec := run(t, r, specCase{method: http.MethodGet, path: "/api/techs", want: http.StatusOK})
	if !strings.Contains(rec.Body.String(), `"key":"aezy"`) {
		t.Errorf("seed aezy tidak ada di jawaban: %.200s", rec.Body)
	}
}

func TestInquiryResponsesMatchSpec(t *testing.T) {
	r := fakeServer(t, seedDB(t))
	key := map[string]string{"Idempotency-Key": uuid.NewString()}
	run(t, r, specCase{method: http.MethodPost, path: "/api/inquiries", body: validInquiry, headers: key, want: http.StatusCreated})
	run(t, r, specCase{method: http.MethodPost, path: "/api/inquiries", body: validInquiry, want: http.StatusBadRequest})
	run(t, r, specCase{method: http.MethodPost, path: "/api/inquiries", body: `{"kind":"lain"}`, headers: key, want: http.StatusBadRequest})
	run(t, r, specCase{method: http.MethodPost, path: "/api/inquiries", body: `{`, headers: key, want: http.StatusBadRequest})
	run(t, r, specCase{method: http.MethodPost, path: "/api/inquiries", body: `{"website":"x"}`, want: http.StatusCreated})

	// The first request used one of the 5, so the sixth new one is refused
	for i := range 4 {
		h := map[string]string{"Idempotency-Key": uuid.NewString()}
		if rec := run(t, r, specCase{method: http.MethodPost, path: "/api/inquiries", body: validInquiry, headers: h, want: http.StatusCreated}); rec.Code != http.StatusCreated {
			t.Fatalf("kiriman ke-%d: %d", i+2, rec.Code)
		}
	}
	h := map[string]string{"Idempotency-Key": uuid.NewString()}
	run(t, r, specCase{method: http.MethodPost, path: "/api/inquiries", body: validInquiry, headers: h, want: http.StatusTooManyRequests})
}

func TestAdminResponsesMatchSpec(t *testing.T) {
	r := fakeServer(t, seedDB(t))
	id := "/api/admin/inquiries/" + testInquiryID.String()
	for _, tc := range []specCase{
		{method: http.MethodGet, path: "/api/admin/me", admin: true, want: http.StatusOK},
		{method: http.MethodGet, path: "/api/admin/me", want: http.StatusUnauthorized},
		{method: http.MethodGet, path: "/api/admin/techs", admin: true, want: http.StatusOK},
		{method: http.MethodGet, path: "/api/admin/collabs", admin: true, want: http.StatusOK},
		{method: http.MethodGet, path: "/api/admin/gallery", admin: true, want: http.StatusOK},
		{method: http.MethodGet, path: "/api/admin/testimonials", admin: true, want: http.StatusOK},
		{method: http.MethodGet, path: "/api/admin/size-charts", admin: true, want: http.StatusOK},
		{method: http.MethodGet, path: "/api/admin/size-charts/aezy-regular", admin: true, want: http.StatusOK},
		{method: http.MethodGet, path: "/api/admin/inquiries?status=new", admin: true, want: http.StatusOK},
		{method: http.MethodGet, path: id, admin: true, want: http.StatusOK},
		{method: http.MethodGet, path: "/api/admin/inquiries/bukan-uuid", admin: true, want: http.StatusNotFound},
		{method: http.MethodGet, path: "/api/admin/inquiries/export?format=csv", admin: true, want: http.StatusOK},
		{method: http.MethodGet, path: "/api/admin/inquiries/export?format=xlsx", admin: true, want: http.StatusOK},
		{method: http.MethodGet, path: "/api/admin/inquiries/export?format=pdf", admin: true, want: http.StatusBadRequest},
		{method: http.MethodGet, path: "/api/admin/audit-log", admin: true, want: http.StatusOK},
		{method: http.MethodGet, path: "/api/admin/settings", admin: true, want: http.StatusOK},
		{method: http.MethodPatch, path: "/api/admin/collabs/marvel", body: `{"available":false}`, admin: true, want: http.StatusOK},
		{method: http.MethodPatch, path: "/api/admin/collabs/marvel", body: `{}`, admin: true, want: http.StatusBadRequest},
		{method: http.MethodPatch, path: id, body: `{"status":"contacted"}`, admin: true, want: http.StatusOK},
		{method: http.MethodPatch, path: id, body: `{"status":"lain"}`, admin: true, want: http.StatusBadRequest},
		{method: http.MethodPut, path: "/api/admin/size-charts/aezy-regular", body: `{"title":"AEZY Regular T-Shirt","rows":"Size | Width\nS | 48"}`, admin: true, want: http.StatusOK},
		{method: http.MethodPut, path: "/api/admin/size-charts/aezy-regular", body: `{"title":""}`, admin: true, want: http.StatusBadRequest},
		{method: http.MethodDelete, path: "/api/admin/size-charts/aezy-regular", admin: true, want: http.StatusNoContent},
		{method: http.MethodPut, path: "/api/admin/settings/password-gate", body: `{"enabled":true}`, admin: true, want: http.StatusOK},
		{method: http.MethodPost, path: "/api/admin/gallery", admin: true, want: http.StatusBadRequest},
		{method: http.MethodDelete, path: "/api/admin/gallery/bukan-uuid", admin: true, want: http.StatusNotFound},
		{method: http.MethodPost, path: "/api/admin/logout", admin: true, want: http.StatusNoContent},
		{method: http.MethodPost, path: "/api/admin/logout", headers: map[string]string{"Cookie": auth.CookieName + "=" + validToken}, want: http.StatusForbidden},
	} {
		run(t, r, tc)
	}
}
