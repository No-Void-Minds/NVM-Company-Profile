// Package httpapi wires the Gin router, handlers, and middleware.
package httpapi

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/config"
)

func NewRouter(cfg config.Config) (*gin.Engine, error) {
	gin.SetMode(cfg.GinMode)
	r := gin.New()
	if err := r.SetTrustedProxies(cfg.TrustedProxies); err != nil {
		return nil, err
	}
	r.Use(requestID(), accessLog(), recoverJSON(), securityHeaders())
	r.NoRoute(func(c *gin.Context) {
		respondError(c, http.StatusNotFound, codeNotFound, "Alamat tidak ditemukan.", nil)
	})

	api := r.Group("/api")
	api.GET("/health", func(c *gin.Context) {
		c.Header("Cache-Control", "no-store")
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	return r, nil
}
