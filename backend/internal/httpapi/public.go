package httpapi

import (
	"encoding/xml"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/content"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db/sqlc"
)

// langQuery reads ?lang=id|en (FR-113). Indonesian is the default site language.
func langQuery(c *gin.Context) (string, bool) {
	switch lang := c.DefaultQuery("lang", content.LangID); lang {
	case content.LangID, content.LangEN:
		return lang, true
	default:
		respondError(c, http.StatusBadRequest, codeValidation, "Bahasa harus id atau en.", map[string]string{"lang": "id atau en"})
		return "", false
	}
}

// A hidden tech (FR-134) is left out of the public API, so no page can show it.
func (s *server) listTechs(c *gin.Context) {
	s.respondTechs(c, false)
}

func (s *server) adminListTechs(c *gin.Context) {
	s.respondTechs(c, true)
}

func (s *server) respondTechs(c *gin.Context, includeHidden bool) {
	lang, ok := langQuery(c)
	if !ok {
		return
	}
	techs, err := s.q.ListTechsByLang(c, sqlc.ListTechsByLangParams{Lang: lang, IncludeHidden: includeHidden})
	if err != nil {
		s.internalError(c, err)
		return
	}
	links, err := s.q.ListTechLinks(c)
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, content.NewTechs(techs, links))
}

func (s *server) listCollabs(c *gin.Context) {
	collabs, err := s.q.ListCollabs(c)
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, collabs)
}

func (s *server) labStats(c *gin.Context) {
	stats, err := s.q.GetLabStats(c)
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"systems":  stats.Systems,
		"on_rack":  stats.OnRack,
		"est_year": s.cfg.BrandEstYear,
	})
}

func optionalQuery(c *gin.Context, name string) *string {
	if v := strings.TrimSpace(c.Query(name)); v != "" {
		return &v
	}
	return nil
}

func (s *server) listGallery(c *gin.Context) {
	lang, ok := langQuery(c)
	if !ok {
		return
	}
	items, err := s.q.ListVisibleGallery(c, optionalQuery(c, "category"))
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, content.MapSlice(items, func(g sqlc.GalleryItem) content.GalleryItem {
		return content.NewGalleryItem(g, lang)
	}))
}

func (s *server) listTestimonials(c *gin.Context) {
	items, err := s.q.ListPublishedTestimonials(c, sqlc.ListPublishedTestimonialsParams{
		Source: optionalQuery(c, "source"),
		Tech:   optionalQuery(c, "tech"),
	})
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, content.MapSlice(items, content.NewTestimonial))
}

func (s *server) getSizeChart(c *gin.Context) {
	chart, err := s.q.GetSizeChart(c, c.Param("key"))
	if errors.Is(err, pgx.ErrNoRows) {
		respondError(c, http.StatusNotFound, codeNotFound, "Size chart untuk kombinasi ini belum tersedia.", nil)
		return
	}
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, content.NewSizeChart(chart))
}

var publicRoutes = []string{
	"/", "/brand", "/teknologi", "/produk", "/b2b", "/galeri", "/testimoni", "/size", "/kontak", "/privasi",
}

type sitemapLink struct {
	Rel      string `xml:"rel,attr"`
	Hreflang string `xml:"hreflang,attr"`
	Href     string `xml:"href,attr"`
}

type sitemapURL struct {
	Loc   string        `xml:"loc"`
	Links []sitemapLink `xml:"xhtml:link"`
}

type sitemapSet struct {
	XMLName xml.Name     `xml:"urlset"`
	Xmlns   string       `xml:"xmlns,attr"`
	Xhtml   string       `xml:"xmlns:xhtml,attr"`
	URLs    []sitemapURL `xml:"url"`
}

// englishPath mirrors localePath in the frontend: the English site lives under /en (FR-110).
func englishPath(route string) string {
	if route == "/" {
		return "/en"
	}
	return "/en" + route
}

func (s *server) sitemapSet() sitemapSet {
	set := sitemapSet{
		Xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9",
		Xhtml: "http://www.w3.org/1999/xhtml",
	}
	for _, route := range publicRoutes {
		id := s.cfg.PublicBaseURL + route
		en := s.cfg.PublicBaseURL + englishPath(route)
		// Both language versions list the same alternates, Indonesian is the default (FR-117).
		links := []sitemapLink{
			{Rel: "alternate", Hreflang: "id", Href: id},
			{Rel: "alternate", Hreflang: "en", Href: en},
			{Rel: "alternate", Hreflang: "x-default", Href: id},
		}
		set.URLs = append(set.URLs, sitemapURL{Loc: id, Links: links}, sitemapURL{Loc: en, Links: links})
	}
	return set
}

func (s *server) sitemap(c *gin.Context) {
	// A locked site lists nothing (FR-122). no-store, so the 404 is not remembered after unlocking.
	if s.gateState.Enabled(c) {
		respondError(c, http.StatusNotFound, codeNotFound, "Alamat tidak ditemukan.", nil)
		return
	}
	body, err := xml.Marshal(s.sitemapSet())
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.Header("Cache-Control", "public, max-age=3600")
	c.Data(http.StatusOK, "application/xml; charset=utf-8", append([]byte(xml.Header), body...))
}

func (s *server) robots(c *gin.Context) {
	if s.gateState.Enabled(c) {
		c.Header("Cache-Control", "no-store")
		c.String(http.StatusOK, "User-agent: *\nDisallow: /\n")
		return
	}
	c.Header("Cache-Control", "public, max-age=3600")
	c.String(http.StatusOK, "User-agent: *\nDisallow: /admin\n\nSitemap: %s/sitemap.xml\n", s.cfg.PublicBaseURL)
}
