package httpapi

import (
	"crypto/rand"
	"encoding/hex"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

const requestIDHeader = "X-Request-ID"

// Client supplied ids are ignored so they cannot forge log lines.
func requestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		buf := make([]byte, 8)
		_, _ = rand.Read(buf)
		id := hex.EncodeToString(buf)
		c.Set("request_id", id)
		c.Header(requestIDHeader, id)
		c.Next()
	}
}

func accessLog() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		slog.Info("request",
			"id", c.GetString("request_id"),
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", c.Writer.Status(),
			"ms", time.Since(start).Milliseconds(),
		)
	}
}

func recoverJSON() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered any) {
		slog.Error("panic", "id", c.GetString("request_id"), "error", recovered)
		respondError(c, http.StatusInternalServerError, codeInternal, "Terjadi kesalahan di server.", nil)
	})
}

// HTML pages get their own CSP from Nginx, these responses only carry data.
func securityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.Writer.Header()
		h.Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		h.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		c.Next()
	}
}
