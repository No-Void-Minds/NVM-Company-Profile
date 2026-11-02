package httpapi

import (
	"errors"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/content"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db/sqlc"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/media"
)

const (
	maxMultipartOverhead = 1 << 20
	maxJSONBody          = 64 << 10
	maxUploadMessage     = "Ukuran file maksimal 8 MB."
	foreignKeyViolation  = "23503"
)

func (s *server) serveMedia(c *gin.Context) {
	path, ok := s.media.Path(c.Param("name"))
	if !ok {
		respondError(c, http.StatusNotFound, codeNotFound, "Gambar tidak ditemukan.", nil)
		return
	}
	if _, err := os.Stat(path); err != nil {
		respondError(c, http.StatusNotFound, codeNotFound, "Gambar tidak ditemukan.", nil)
		return
	}
	c.Header("Cache-Control", "public, max-age=31536000, immutable")
	c.Header("Content-Type", "image/webp")
	c.File(path)
}

// parseUpload must run before any PostForm call, which would otherwise read the
// whole body with no size limit and hide the parse error.
func parseUpload(c *gin.Context) bool {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, media.MaxUploadBytes+maxMultipartOverhead)
	err := c.Request.ParseMultipartForm(media.MaxUploadBytes + maxMultipartOverhead)
	if err == nil {
		return true
	}
	var tooBig *http.MaxBytesError
	if errors.As(err, &tooBig) {
		respondError(c, http.StatusBadRequest, codeValidation, maxUploadMessage, map[string]string{"image": maxUploadMessage})
		return false
	}
	respondError(c, http.StatusBadRequest, codeValidation, "Formulir unggahan tidak bisa dibaca.", nil)
	return false
}

// readUpload returns the stored variants, or writes the error response and false.
func (s *server) readUpload(c *gin.Context) (media.Stored, bool) {
	header, err := c.FormFile("image")
	if err != nil {
		respondError(c, http.StatusBadRequest, codeValidation, "Pilih file gambar.", map[string]string{"image": "Pilih file gambar."})
		return media.Stored{}, false
	}
	if header.Size > media.MaxUploadBytes {
		respondError(c, http.StatusBadRequest, codeValidation, maxUploadMessage, map[string]string{"image": maxUploadMessage})
		return media.Stored{}, false
	}
	file, err := header.Open()
	if err != nil {
		s.internalError(c, err)
		return media.Stored{}, false
	}
	defer file.Close()
	data, err := io.ReadAll(file)
	if err != nil {
		s.internalError(c, err)
		return media.Stored{}, false
	}

	stored, err := s.media.Save(data)
	switch {
	case errors.Is(err, media.ErrUnsupported), errors.Is(err, media.ErrTooLarge):
		msg := err.Error() + "."
		respondError(c, http.StatusBadRequest, codeValidation, msg, map[string]string{"image": msg})
		return media.Stored{}, false
	case err != nil:
		s.internalError(c, err)
		return media.Stored{}, false
	}
	return stored, true
}

func idParam(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusNotFound, codeNotFound, "Data tidak ditemukan.", nil)
		return uuid.Nil, false
	}
	return id, true
}

func (s *server) lookupError(c *gin.Context, err error) {
	if errors.Is(err, pgx.ErrNoRows) {
		respondError(c, http.StatusNotFound, codeNotFound, "Data tidak ditemukan.", nil)
		return
	}
	s.internalError(c, err)
}

type galleryInput struct {
	Category string `json:"category"`
	Alt      string `json:"alt"`
	Caption  string `json:"caption"`
	Visible  bool   `json:"visible"`
	Sort     int32  `json:"sort"`
}

func (in *galleryInput) clean() map[string]string {
	in.Category = strings.TrimSpace(in.Category)
	in.Alt = strings.TrimSpace(in.Alt)
	in.Caption = strings.TrimSpace(in.Caption)

	fields := map[string]string{}
	if n := utf8.RuneCountInString(in.Category); n < 1 || n > 60 {
		fields["category"] = "Kategori wajib diisi, maksimal 60 karakter."
	}
	if n := utf8.RuneCountInString(in.Alt); n < 1 || n > 300 {
		fields["alt"] = "Teks alt wajib diisi, maksimal 300 karakter."
	}
	if utf8.RuneCountInString(in.Caption) > 300 {
		fields["caption"] = "Keterangan maksimal 300 karakter."
	}
	return fields
}

func (s *server) adminListGallery(c *gin.Context) {
	items, err := s.q.ListAllGallery(c)
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, content.MapSlice(items, content.NewAdminGalleryItem))
}

func (s *server) adminCreateGallery(c *gin.Context) {
	if !parseUpload(c) {
		return
	}
	sort, _ := strconv.Atoi(c.PostForm("sort"))
	in := galleryInput{
		Category: c.PostForm("category"),
		Alt:      c.PostForm("alt"),
		Caption:  c.PostForm("caption"),
		Visible:  c.DefaultPostForm("visible", "true") == "true",
		Sort:     int32(sort),
	}
	if fields := in.clean(); len(fields) > 0 {
		respondError(c, http.StatusBadRequest, codeValidation, "Periksa lagi isian yang ditandai.", fields)
		return
	}
	stored, ok := s.readUpload(c)
	if !ok {
		return
	}
	item, err := s.q.CreateGalleryItem(c, sqlc.CreateGalleryItemParams{
		Category: in.Category,
		Alt:      in.Alt,
		Caption:  in.Caption,
		ImageKey: stored.Key,
		Width:    stored.Width,
		Height:   stored.Height,
		Visible:  in.Visible,
		Sort:     in.Sort,
	})
	if err != nil {
		s.media.Remove(stored.Key)
		s.internalError(c, err)
		return
	}
	c.Set(auditEntityID, item.ID.String())
	c.JSON(http.StatusCreated, content.NewAdminGalleryItem(item))
}

func (s *server) adminUpdateGallery(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}
	current, err := s.q.GetGalleryItem(c, id)
	if err != nil {
		s.lookupError(c, err)
		return
	}
	// Decoding over the stored values gives PATCH its partial update behavior.
	in := galleryInput{
		Category: current.Category,
		Alt:      current.Alt,
		Caption:  current.Caption,
		Visible:  current.Visible,
		Sort:     current.Sort,
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxJSONBody)
	if err := c.ShouldBindJSON(&in); err != nil {
		respondError(c, http.StatusBadRequest, codeValidation, "Data tidak bisa dibaca.", nil)
		return
	}
	if fields := in.clean(); len(fields) > 0 {
		respondError(c, http.StatusBadRequest, codeValidation, "Periksa lagi isian yang ditandai.", fields)
		return
	}
	item, err := s.q.UpdateGalleryItem(c, sqlc.UpdateGalleryItemParams{
		ID:       id,
		Category: in.Category,
		Alt:      in.Alt,
		Caption:  in.Caption,
		Visible:  in.Visible,
		Sort:     in.Sort,
	})
	if err != nil {
		s.lookupError(c, err)
		return
	}
	c.JSON(http.StatusOK, content.NewAdminGalleryItem(item))
}

func (s *server) adminDeleteGallery(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}
	key, err := s.q.DeleteGalleryItem(c, id)
	if err != nil {
		s.lookupError(c, err)
		return
	}
	s.media.Remove(key)
	c.Status(http.StatusNoContent)
}

type testimonialInput struct {
	Source           string  `json:"source"`
	ReviewDate       string  `json:"review_date"`
	TechKey          *string `json:"tech_key"`
	Rating           *int16  `json:"rating"`
	Transcript       string  `json:"transcript"`
	BlurredConfirmed bool    `json:"blurred_confirmed"`
	Published        bool    `json:"published"`
}

func (in *testimonialInput) clean() (time.Time, map[string]string) {
	in.Transcript = strings.TrimSpace(in.Transcript)
	if in.TechKey != nil && strings.TrimSpace(*in.TechKey) == "" {
		in.TechKey = nil
	}

	fields := map[string]string{}
	if in.Source != "shopee" && in.Source != "tiktok_shop" {
		fields["source"] = "Pilih sumber Shopee atau TikTok Shop."
	}
	date, err := time.Parse("2006-01-02", in.ReviewDate)
	if err != nil {
		fields["review_date"] = "Isi tanggal ulasan."
	}
	if in.Rating != nil && (*in.Rating < 1 || *in.Rating > 5) {
		fields["rating"] = "Rating harus 1 sampai 5."
	}
	if n := utf8.RuneCountInString(in.Transcript); n < 1 || n > 5000 {
		fields["transcript"] = "Transkrip wajib diisi, maksimal 5000 karakter."
	}
	return date, fields
}

func respondBlurRequired(c *gin.Context) {
	msg := "Centang dulu bahwa nama dan foto pembeli sudah diburamkan."
	respondError(c, http.StatusConflict, codeConflict, msg, map[string]string{"blurred_confirmed": msg})
}

func isForeignKeyError(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == foreignKeyViolation
}

func respondUnknownTech(c *gin.Context) {
	msg := "Tech tidak dikenal."
	respondError(c, http.StatusBadRequest, codeValidation, msg, map[string]string{"tech_key": msg})
}

func (s *server) adminListTestimonials(c *gin.Context) {
	items, err := s.q.ListAllTestimonials(c)
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, content.MapSlice(items, content.NewAdminTestimonial))
}

func (s *server) adminCreateTestimonial(c *gin.Context) {
	if !parseUpload(c) {
		return
	}
	in := testimonialInput{
		Source:           c.PostForm("source"),
		ReviewDate:       c.PostForm("review_date"),
		Transcript:       c.PostForm("transcript"),
		BlurredConfirmed: c.PostForm("blurred_confirmed") == "true",
		Published:        c.PostForm("published") == "true",
	}
	if tech := c.PostForm("tech_key"); tech != "" {
		in.TechKey = &tech
	}
	fields := map[string]string{}
	if raw := c.PostForm("rating"); raw != "" {
		rating, err := strconv.ParseInt(raw, 10, 16)
		if err != nil {
			fields["rating"] = "Rating harus 1 sampai 5."
		} else {
			value := int16(rating)
			in.Rating = &value
		}
	}
	date, more := in.clean()
	for name, msg := range more {
		fields[name] = msg
	}
	if len(fields) > 0 {
		respondError(c, http.StatusBadRequest, codeValidation, "Periksa lagi isian yang ditandai.", fields)
		return
	}
	if in.Published && !in.BlurredConfirmed {
		respondBlurRequired(c)
		return
	}

	stored, ok := s.readUpload(c)
	if !ok {
		return
	}
	item, err := s.q.CreateTestimonial(c, sqlc.CreateTestimonialParams{
		Source:           in.Source,
		ReviewDate:       date,
		TechKey:          in.TechKey,
		Rating:           in.Rating,
		Transcript:       in.Transcript,
		ImageKey:         stored.Key,
		Width:            stored.Width,
		Height:           stored.Height,
		BlurredConfirmed: in.BlurredConfirmed,
		Published:        in.Published,
	})
	if err != nil {
		s.media.Remove(stored.Key)
		if isForeignKeyError(err) {
			respondUnknownTech(c)
			return
		}
		s.internalError(c, err)
		return
	}
	c.Set(auditEntityID, item.ID.String())
	c.JSON(http.StatusCreated, content.NewAdminTestimonial(item))
}

func (s *server) adminUpdateTestimonial(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}
	current, err := s.q.GetTestimonial(c, id)
	if err != nil {
		s.lookupError(c, err)
		return
	}
	in := testimonialInput{
		Source:           current.Source,
		ReviewDate:       current.ReviewDate.Format("2006-01-02"),
		TechKey:          current.TechKey,
		Rating:           current.Rating,
		Transcript:       current.Transcript,
		BlurredConfirmed: current.BlurredConfirmed,
		Published:        current.Published,
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxJSONBody)
	if err := c.ShouldBindJSON(&in); err != nil {
		respondError(c, http.StatusBadRequest, codeValidation, "Data tidak bisa dibaca.", nil)
		return
	}
	date, fields := in.clean()
	if len(fields) > 0 {
		respondError(c, http.StatusBadRequest, codeValidation, "Periksa lagi isian yang ditandai.", fields)
		return
	}
	if in.Published && !in.BlurredConfirmed {
		respondBlurRequired(c)
		return
	}
	item, err := s.q.UpdateTestimonial(c, sqlc.UpdateTestimonialParams{
		ID:               id,
		Source:           in.Source,
		ReviewDate:       date,
		TechKey:          in.TechKey,
		Rating:           in.Rating,
		Transcript:       in.Transcript,
		BlurredConfirmed: in.BlurredConfirmed,
		Published:        in.Published,
	})
	if err != nil {
		if isForeignKeyError(err) {
			respondUnknownTech(c)
			return
		}
		s.lookupError(c, err)
		return
	}
	c.JSON(http.StatusOK, content.NewAdminTestimonial(item))
}

func (s *server) adminDeleteTestimonial(c *gin.Context) {
	id, ok := idParam(c)
	if !ok {
		return
	}
	key, err := s.q.DeleteTestimonial(c, id)
	if err != nil {
		s.lookupError(c, err)
		return
	}
	s.media.Remove(key)
	c.Status(http.StatusNoContent)
}
