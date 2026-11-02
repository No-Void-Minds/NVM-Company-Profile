package httpapi

import (
	"log/slog"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db/sqlc"
)

const adminPathPrefix = "/api/admin/"

var auditActions = map[string]string{
	http.MethodPost:   "create",
	http.MethodPatch:  "update",
	http.MethodPut:    "save",
	http.MethodDelete: "delete",
}

// auditMutations records successful admin writes (FR-96). A failed audit write
// is logged and does not undo a change that has already happened.
func (s *server) auditMutations(c *gin.Context) {
	c.Next()
	if c.Writer.Status() >= http.StatusBadRequest {
		return
	}

	session := sessionOf(c)
	entity, _, _ := strings.Cut(strings.TrimPrefix(c.FullPath(), adminPathPrefix), "/")
	entityID := c.GetString(auditEntityID)
	if entityID == "" {
		entityID = c.Param("id")
	}
	if entityID == "" {
		entityID = c.Param("key")
	}

	// The request context may already be done once the response is written.
	if err := s.q.CreateAuditLog(c.Copy(), sqlc.CreateAuditLogParams{
		UserID:   &session.UserID,
		Action:   auditActions[c.Request.Method],
		Entity:   entity,
		EntityID: entityID,
	}); err != nil {
		slog.Error("gagal menulis audit log", "id", c.GetString("request_id"), "error", err)
	}
}

func (s *server) adminListAudit(c *gin.Context) {
	rows, err := s.q.ListAuditLog(c)
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, rows)
}
