// Package httpapi wires the Gin router, handlers, and middleware.
package httpapi

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/config"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db/sqlc"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/media"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/ratelimit"
)

type server struct {
	cfg          config.Config
	pool         *pgxpool.Pool
	q            *sqlc.Queries
	media        *media.Store
	inquiryLimit *ratelimit.Limiter
	loginLimit   *ratelimit.Limiter
	gateState    *gateState
	// Swappable so tests can check sessions and the gate without a database
	sessionFinder func(ctx context.Context, tokenHash string) (sqlc.GetActiveSessionRow, error)
}

func NewRouter(cfg config.Config, pool *pgxpool.Pool) (*gin.Engine, error) {
	s, err := newServer(cfg, pool)
	if err != nil {
		return nil, err
	}
	return s.routes()
}

func newServer(cfg config.Config, pool *pgxpool.Pool) (*server, error) {
	store, err := media.NewStore(cfg.MediaDir)
	if err != nil {
		return nil, err
	}
	s := &server{
		cfg:          cfg,
		pool:         pool,
		q:            sqlc.New(pool),
		media:        store,
		inquiryLimit: ratelimit.New(5, time.Hour),
		loginLimit:   ratelimit.New(10, 15*time.Minute),
	}
	s.gateState = newGateState(s.loadGate)
	s.sessionFinder = s.q.GetActiveSession
	return s, nil
}

func (s *server) findSession(ctx context.Context, tokenHash string) (sqlc.GetActiveSessionRow, error) {
	return s.sessionFinder(ctx, tokenHash)
}

func (s *server) routes() (*gin.Engine, error) {
	gin.SetMode(s.cfg.GinMode)
	r := gin.New()
	if err := r.SetTrustedProxies(s.cfg.TrustedProxies); err != nil {
		return nil, err
	}
	r.Use(requestID(), accessLog(), recoverJSON(), securityHeaders())
	r.NoRoute(func(c *gin.Context) {
		respondError(c, http.StatusNotFound, codeNotFound, "Alamat tidak ditemukan.", nil)
	})

	r.GET("/sitemap.xml", s.sitemap)
	r.GET("/robots.txt", s.robots)

	api := r.Group("/api")
	api.GET("/health", s.health)
	// Nginx auth_request, before every locked page and public API call (FR-121)
	api.GET("/gate", s.checkGate)
	api.POST("/inquiries", s.gateHeaders(), s.createInquiry)

	public := api.Group("", publicCache(), s.gateHeaders())
	public.GET("/techs", s.listTechs)
	public.GET("/collabs", s.listCollabs)
	public.GET("/lab-stats", s.labStats)
	public.GET("/gallery", s.listGallery)
	public.GET("/testimonials", s.listTestimonials)
	public.GET("/size-charts/:key", s.getSizeChart)

	r.GET("/media/:name", s.serveMedia)

	adminRoot := adminGroup(api)
	adminRoot.POST("/login", s.login)

	admin := adminRoot.Group("", s.requireSession)
	admin.GET("/me", s.me)
	// Same data as the public routes, but uncached, so the admin sees a toggle right after reload.
	admin.GET("/techs", s.listTechs)
	admin.GET("/collabs", s.listCollabs)
	admin.GET("/gallery", s.adminListGallery)
	admin.GET("/testimonials", s.adminListTestimonials)
	admin.GET("/size-charts", s.adminListSizeCharts)
	admin.GET("/size-charts/:key", s.adminGetSizeChart)
	admin.GET("/inquiries", s.adminListInquiries)
	admin.GET("/inquiries/export", s.adminExportInquiries)
	admin.GET("/inquiries/:id", s.adminGetInquiry)

	admin.GET("/audit-log", s.adminListAudit)
	admin.GET("/settings", s.adminGetSettings)

	mutate := admin.Group("", requireCSRF, s.auditMutations)
	mutate.POST("/logout", s.logout)
	mutate.POST("/gallery", s.adminCreateGallery)
	mutate.PATCH("/gallery/:id", s.adminUpdateGallery)
	mutate.DELETE("/gallery/:id", s.adminDeleteGallery)
	mutate.POST("/testimonials", s.adminCreateTestimonial)
	mutate.PATCH("/testimonials/:id", s.adminUpdateTestimonial)
	mutate.DELETE("/testimonials/:id", s.adminDeleteTestimonial)
	mutate.PUT("/size-charts/:key", s.adminPutSizeChart)
	mutate.DELETE("/size-charts/:key", s.adminDeleteSizeChart)
	mutate.PATCH("/techs/:key", s.adminPatchTech)
	mutate.PATCH("/collabs/:key", s.adminPatchCollab)
	mutate.PATCH("/inquiries/:id", s.adminPatchInquiry)
	mutate.PUT("/settings/password-gate", s.adminPutPasswordGate)

	return r, nil
}

func (s *server) health(c *gin.Context) {
	c.Header("Cache-Control", "no-store")
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()
	if err := s.pool.Ping(ctx); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "degraded", "database": "down"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok", "database": "ok"})
}

// Every /api/admin route, login included, is kept out of browser and proxy caches.
func adminGroup(api *gin.RouterGroup) *gin.RouterGroup {
	return api.Group("/admin", noStore())
}

func noStore() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Cache-Control", "no-store")
		c.Next()
	}
}

func publicCache() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Cache-Control", "public, max-age=60")
		c.Next()
	}
}

func (s *server) internalError(c *gin.Context, err error) {
	slog.Error("request gagal", "id", c.GetString("request_id"), "path", c.Request.URL.Path, "error", err)
	respondError(c, http.StatusInternalServerError, codeInternal, "Terjadi kesalahan di server. Coba lagi sebentar.", nil)
}
