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
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/ratelimit"
)

type server struct {
	cfg          config.Config
	pool         *pgxpool.Pool
	q            *sqlc.Queries
	inquiryLimit *ratelimit.Limiter
}

func NewRouter(cfg config.Config, pool *pgxpool.Pool) (*gin.Engine, error) {
	gin.SetMode(cfg.GinMode)
	r := gin.New()
	if err := r.SetTrustedProxies(cfg.TrustedProxies); err != nil {
		return nil, err
	}
	r.Use(requestID(), accessLog(), recoverJSON(), securityHeaders())
	r.NoRoute(func(c *gin.Context) {
		respondError(c, http.StatusNotFound, codeNotFound, "Alamat tidak ditemukan.", nil)
	})

	s := &server{
		cfg:          cfg,
		pool:         pool,
		q:            sqlc.New(pool),
		inquiryLimit: ratelimit.New(5, time.Hour),
	}

	r.GET("/sitemap.xml", s.sitemap)
	r.GET("/robots.txt", s.robots)

	api := r.Group("/api")
	api.GET("/health", s.health)
	api.POST("/inquiries", s.createInquiry)

	public := api.Group("", publicCache())
	public.GET("/techs", s.listTechs)
	public.GET("/collabs", s.listCollabs)
	public.GET("/lab-stats", s.labStats)
	public.GET("/gallery", s.listGallery)
	public.GET("/testimonials", s.listTestimonials)
	public.GET("/size-charts/:key", s.getSizeChart)

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
