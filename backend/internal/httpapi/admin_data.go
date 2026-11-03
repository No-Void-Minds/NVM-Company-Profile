package httpapi

import (
	"errors"
	"net/http"
	"slices"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/content"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db/sqlc"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/export"
)

// auditEntityID lets create handlers name a row whose id is not in the URL.
const auditEntityID = "audit_entity_id"

func (s *server) adminListSizeCharts(c *gin.Context) {
	charts, err := s.q.ListSizeCharts(c)
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, content.MapSlice(charts, content.NewSizeChart))
}

func (s *server) adminGetSizeChart(c *gin.Context) {
	chart, err := s.q.GetSizeChart(c, c.Param("key"))
	if err != nil {
		s.lookupError(c, err)
		return
	}
	c.JSON(http.StatusOK, content.NewSizeChart(chart))
}

func (s *server) adminPutSizeChart(c *gin.Context) {
	key := c.Param("key")
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxJSONBody)
	var in struct {
		Title string `json:"title"`
		Rows  string `json:"rows"`
		Note  string `json:"note"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		respondError(c, http.StatusBadRequest, codeValidation, "Data tidak bisa dibaca.", nil)
		return
	}
	in.Title = strings.TrimSpace(in.Title)
	in.Rows = strings.ReplaceAll(strings.TrimSpace(in.Rows), "\r\n", "\n")
	in.Note = strings.ReplaceAll(strings.TrimSpace(in.Note), "\r\n", "\n")

	fields := map[string]string{}
	if !content.ValidSizeChartKey(key) {
		fields["key"] = "Key memakai huruf kecil, angka, dan tanda hubung, contoh aezy-regular."
	}
	if n := utf8.RuneCountInString(in.Title); n < 1 || n > 120 {
		fields["title"] = "Judul wajib diisi, maksimal 120 karakter."
	}
	if err := content.ValidateChartRows(in.Rows); err != nil {
		fields["rows"] = "Baris tabel belum benar: " + err.Error() + "."
	}
	if utf8.RuneCountInString(in.Note) > 1000 {
		fields["note"] = "Catatan maksimal 1000 karakter."
	}
	if len(fields) > 0 {
		respondError(c, http.StatusBadRequest, codeValidation, "Periksa lagi isian yang ditandai.", fields)
		return
	}

	username := sessionOf(c).Username
	chart, err := s.q.UpsertSizeChart(c, sqlc.UpsertSizeChartParams{
		Key:       key,
		Title:     in.Title,
		Rows:      in.Rows,
		Note:      in.Note,
		UpdatedBy: &username,
	})
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, content.NewSizeChart(chart))
}

func (s *server) adminDeleteSizeChart(c *gin.Context) {
	affected, err := s.q.DeleteSizeChart(c, c.Param("key"))
	if err != nil {
		s.internalError(c, err)
		return
	}
	if affected == 0 {
		respondError(c, http.StatusNotFound, codeNotFound, "Data tidak ditemukan.", nil)
		return
	}
	c.Status(http.StatusNoContent)
}

type techPatch struct {
	OnRack  *bool               `json:"on_rack"`
	Visible *bool               `json:"visible"`
	Links   *[]content.TechLink `json:"links"`
}

// linkField names the form field of a link in error responses: links.<fit>, or links for no fit.
func linkField(fit *string) string {
	if fit == nil {
		return "links"
	}
	return "links." + *fit
}

// validateTechLinks keeps one link per fit of the tech, or one fit-less link for a tech
// without fits (FR-133). Empty links mean "no link" and are dropped.
func validateTechLinks(fits []string, links []content.TechLink) ([]content.TechLink, map[string]string) {
	fields := map[string]string{}
	seen := map[string]bool{}
	var kept []content.TechLink
	for _, l := range links {
		field := linkField(l.Fit)
		switch {
		case l.Fit == nil && len(fits) > 0:
			fields[field] = "Tech ini punya fit, isi link per fit."
		case l.Fit != nil && !slices.Contains(fits, *l.Fit):
			fields[field] = "Fit tidak dikenal untuk tech ini."
		case seen[field]:
			fields[field] = "Fit ini dikirim dua kali."
		default:
			if err := content.ValidateShopeeURL(l.URL); err != nil {
				fields[field] = err.Error()
			}
		}
		seen[field] = true
		if l.URL != "" {
			kept = append(kept, l)
		}
	}
	return kept, fields
}

func fitSort(fits []string, fit *string) int32 {
	if fit == nil {
		return 0
	}
	return int32(slices.Index(fits, *fit) + 1)
}

func (s *server) adminPatchTech(c *gin.Context) {
	var in techPatch
	if err := c.ShouldBindJSON(&in); err != nil || (in.OnRack == nil && in.Visible == nil && in.Links == nil) {
		respondError(c, http.StatusBadRequest, codeValidation, "Kirim on_rack, visible, atau links.", nil)
		return
	}
	tech, err := s.q.GetTech(c, c.Param("key"))
	if err != nil {
		s.lookupError(c, err)
		return
	}
	var links []content.TechLink
	if in.Links != nil {
		var fields map[string]string
		links, fields = validateTechLinks(tech.Fits, *in.Links)
		if len(fields) > 0 {
			respondError(c, http.StatusBadRequest, codeValidation, "Periksa link Shopee.", fields)
			return
		}
	}

	tx, err := s.pool.Begin(c)
	if err != nil {
		s.internalError(c, err)
		return
	}
	defer func() { _ = tx.Rollback(c) }()
	q := s.q.WithTx(tx)
	tech, err = q.UpdateTech(c, sqlc.UpdateTechParams{Key: tech.Key, OnRack: in.OnRack, Visible: in.Visible})
	if err != nil {
		s.internalError(c, err)
		return
	}
	if in.Links != nil {
		if err := q.DeleteTechLinks(c, tech.Key); err != nil {
			s.internalError(c, err)
			return
		}
		for _, l := range links {
			if err := q.CreateTechLink(c, sqlc.CreateTechLinkParams{
				TechKey: tech.Key, Fit: l.Fit, Url: l.URL, Sort: fitSort(tech.Fits, l.Fit),
			}); err != nil {
				s.internalError(c, err)
				return
			}
		}
	}
	if err := tx.Commit(c); err != nil {
		s.internalError(c, err)
		return
	}
	// Same shape as GET /api/admin/techs, so the admin page can swap the row in place
	rows, err := s.q.ListTechsByLang(c, sqlc.ListTechsByLangParams{Lang: content.LangID, IncludeHidden: true})
	if err != nil {
		s.internalError(c, err)
		return
	}
	stored, err := s.q.ListTechLinks(c)
	if err != nil {
		s.internalError(c, err)
		return
	}
	for _, t := range content.NewTechs(rows, stored) {
		if t.Key == tech.Key {
			c.JSON(http.StatusOK, t)
			return
		}
	}
	s.internalError(c, errors.New("tech hilang setelah disimpan"))
}

func (s *server) adminPatchCollab(c *gin.Context) {
	var in struct {
		Available *bool   `json:"available"`
		URL       *string `json:"url"`
	}
	if err := c.ShouldBindJSON(&in); err != nil || (in.Available == nil && in.URL == nil) {
		respondError(c, http.StatusBadRequest, codeValidation, "Kirim available atau url.", nil)
		return
	}
	params := sqlc.UpdateCollabParams{Key: c.Param("key"), Available: in.Available, SetUrl: in.URL != nil}
	if in.URL != nil {
		if err := content.ValidateShopeeURL(*in.URL); err != nil {
			respondError(c, http.StatusBadRequest, codeValidation, "Periksa link Shopee.", map[string]string{"url": err.Error()})
			return
		}
		// Empty clears the link, the collab then shows as plain text
		if *in.URL != "" {
			params.Url = in.URL
		}
	}
	collab, err := s.q.UpdateCollab(c, params)
	if err != nil {
		s.lookupError(c, err)
		return
	}
	c.JSON(http.StatusOK, collab)
}

// inquiryView leaves out ip_hash and idempotency_key, the admin has no use for them.
type inquiryView struct {
	ID           uuid.UUID `json:"id"`
	Code         string    `json:"code"`
	Kind         string    `json:"kind"`
	Name         string    `json:"name"`
	Org          string    `json:"org"`
	City         string    `json:"city"`
	Phone        string    `json:"phone"`
	Email        string    `json:"email"`
	Channels     string    `json:"channels"`
	Techs        []string  `json:"techs"`
	QuantityNote string    `json:"quantity_note"`
	Message      string    `json:"message"`
	ConsentAt    time.Time `json:"consent_at"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
}

func newInquiryView(in sqlc.Inquiry) inquiryView {
	return inquiryView{
		ID:           in.ID,
		Code:         in.Code,
		Kind:         in.Kind,
		Name:         in.Name,
		Org:          in.Org,
		City:         in.City,
		Phone:        in.Phone,
		Email:        in.Email,
		Channels:     in.Channels,
		Techs:        in.Techs,
		QuantityNote: in.QuantityNote,
		Message:      in.Message,
		ConsentAt:    in.ConsentAt,
		Status:       in.Status,
		CreatedAt:    in.CreatedAt,
	}
}

func (s *server) adminListInquiries(c *gin.Context) {
	items, err := s.q.ListInquiries(c, sqlc.ListInquiriesParams{
		Kind:   optionalQuery(c, "kind"),
		Status: optionalQuery(c, "status"),
	})
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, content.MapSlice(items, newInquiryView))
}

func (s *server) adminGetInquiry(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}
	item, err := s.q.GetInquiry(c, id)
	if err != nil {
		s.lookupError(c, err)
		return
	}
	c.JSON(http.StatusOK, newInquiryView(item))
}

func (s *server) adminPatchInquiry(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}
	var in struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		respondError(c, http.StatusBadRequest, codeValidation, "Data tidak bisa dibaca.", nil)
		return
	}
	switch in.Status {
	case "new", "contacted", "done", "spam":
	default:
		msg := "Status tidak dikenal."
		respondError(c, http.StatusBadRequest, codeValidation, msg, map[string]string{"status": msg})
		return
	}
	item, err := s.q.SetInquiryStatus(c, sqlc.SetInquiryStatusParams{ID: id, Status: in.Status})
	if err != nil {
		s.lookupError(c, err)
		return
	}
	c.JSON(http.StatusOK, newInquiryView(item))
}

func (s *server) adminExportInquiries(c *gin.Context) {
	format := c.Query("format")
	if format != "csv" && format != "xlsx" {
		respondError(c, http.StatusBadRequest, codeValidation, "Format ekspor harus csv atau xlsx.", nil)
		return
	}
	items, err := s.q.ListInquiries(c, sqlc.ListInquiriesParams{})
	if err != nil {
		s.internalError(c, err)
		return
	}

	c.Header("Content-Disposition", `attachment; filename="`+export.FileName(time.Now(), format)+`"`)
	if format == "csv" {
		c.Header("Content-Type", "text/csv; charset=utf-8")
		err = export.WriteCSV(c.Writer, items)
	} else {
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		err = export.WriteXLSX(c.Writer, items)
	}
	if err != nil {
		s.internalError(c, err)
	}
}
