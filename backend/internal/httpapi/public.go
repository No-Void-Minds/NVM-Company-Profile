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

func (s *server) listTechs(c *gin.Context) {
	techs, err := s.q.ListTechs(c)
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, techs)
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
	items, err := s.q.ListVisibleGallery(c, optionalQuery(c, "category"))
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, content.MapSlice(items, content.NewGalleryItem))
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

type sitemapURL struct {
	Loc string `xml:"loc"`
}

type sitemapSet struct {
	XMLName xml.Name     `xml:"urlset"`
	Xmlns   string       `xml:"xmlns,attr"`
	URLs    []sitemapURL `xml:"url"`
}

func (s *server) sitemap(c *gin.Context) {
	set := sitemapSet{Xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9"}
	for _, route := range publicRoutes {
		set.URLs = append(set.URLs, sitemapURL{Loc: s.cfg.PublicBaseURL + route})
	}
	body, err := xml.Marshal(set)
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.Header("Cache-Control", "public, max-age=3600")
	c.Data(http.StatusOK, "application/xml; charset=utf-8", append([]byte(xml.Header), body...))
}

func (s *server) robots(c *gin.Context) {
	c.Header("Cache-Control", "public, max-age=3600")
	c.String(http.StatusOK, "User-agent: *\nDisallow: /admin\n\nSitemap: %s/sitemap.xml\n", s.cfg.PublicBaseURL)
}
