package httpapi

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

// docsFiles maps the published names under /api/docs to files in DocsDir. Nothing else in
// the folder is served, and the files are read from disk so they never ship in the image.
var docsFiles = map[string]struct{ path, contentType string }{
	"openapi.yaml":         {"openapi.yaml", "application/yaml; charset=utf-8"},
	"swagger-ui.css":       {"swagger-ui/swagger-ui.css", "text/css; charset=utf-8"},
	"swagger-ui-bundle.js": {"swagger-ui/swagger-ui-bundle.js", "text/javascript; charset=utf-8"},
	"swagger-init.js":      {"swagger-ui/swagger-init.js", "text/javascript; charset=utf-8"},
}

// Swagger UI needs its own scripts, styles, and inline style attributes, the API default is 'none'.
const docsCSP = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
	"img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'"

func (s *server) docsPage(c *gin.Context) {
	s.sendDocsFile(c, "swagger-ui/index.html", "text/html; charset=utf-8")
}

func (s *server) docsFile(c *gin.Context) {
	file, ok := docsFiles[c.Param("file")]
	if !ok {
		respondError(c, http.StatusNotFound, codeNotFound, "Alamat tidak ditemukan.", nil)
		return
	}
	s.sendDocsFile(c, file.path, file.contentType)
}

func (s *server) sendDocsFile(c *gin.Context, name, contentType string) {
	// Read whole instead of http.ServeFile, which would add 304 and range answers
	body, err := os.ReadFile(filepath.Join(s.cfg.DocsDir, filepath.FromSlash(name)))
	if err != nil {
		respondError(c, http.StatusNotFound, codeNotFound, "File dokumentasi tidak ditemukan. Periksa DOCS_DIR.", nil)
		return
	}
	c.Header("Cache-Control", "no-store")
	c.Header("Content-Security-Policy", docsCSP)
	c.Header("X-Robots-Tag", "noindex")
	c.Data(http.StatusOK, contentType, body)
}
