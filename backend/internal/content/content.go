// Package content shapes stored content into the JSON the API promises.
package content

import (
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db/sqlc"
)

const dateLayout = "2006-01-02"

// Languages of the public site (SRS 14.4)
const (
	LangID = "id"
	LangEN = "en"
)

// VariantWidths lists the WebP widths written for every upload (NFR-02).
var VariantWidths = []int{480, 960, 1600}

type Image struct {
	Src    string `json:"src"`
	Srcset string `json:"srcset"`
	Width  int32  `json:"width"`
	Height int32  `json:"height"`
}

func VariantName(key uuid.UUID, width int) string {
	return fmt.Sprintf("%s-%d.webp", key, width)
}

func newImage(key uuid.UUID, width, height int32) Image {
	srcset := ""
	for i, w := range VariantWidths {
		if i > 0 {
			srcset += ", "
		}
		srcset += fmt.Sprintf("/media/%s %dw", VariantName(key, w), w)
	}
	return Image{
		Src:    "/media/" + VariantName(key, 960),
		Srcset: srcset,
		Width:  width,
		Height: height,
	}
}

type GalleryItem struct {
	ID       uuid.UUID `json:"id"`
	Category string    `json:"category"`
	Alt      string    `json:"alt"`
	Caption  string    `json:"caption"`
	Image    Image     `json:"image"`
}

type AdminGalleryItem struct {
	GalleryItem
	AltEn     string    `json:"alt_en"`
	CaptionEn string    `json:"caption_en"`
	Visible   bool      `json:"visible"`
	Sort      int32     `json:"sort"`
	CreatedAt time.Time `json:"created_at"`
}

// NewGalleryItem picks the English text when asked for and filled in, else the
// Indonesian one, so an English page never shows an empty alt (FR-115).
func NewGalleryItem(g sqlc.GalleryItem, lang string) GalleryItem {
	alt, caption := g.Alt, g.Caption
	if lang == LangEN {
		if g.AltEn != "" {
			alt = g.AltEn
		}
		if g.CaptionEn != "" {
			caption = g.CaptionEn
		}
	}
	return GalleryItem{
		ID:       g.ID,
		Category: g.Category,
		Alt:      alt,
		Caption:  caption,
		Image:    newImage(g.ImageKey, g.Width, g.Height),
	}
}

func NewAdminGalleryItem(g sqlc.GalleryItem) AdminGalleryItem {
	return AdminGalleryItem{
		GalleryItem: NewGalleryItem(g, LangID),
		AltEn:       g.AltEn,
		CaptionEn:   g.CaptionEn,
		Visible:     g.Visible,
		Sort:        g.Sort,
		CreatedAt:   g.CreatedAt,
	}
}

type Testimonial struct {
	ID         uuid.UUID `json:"id"`
	Source     string    `json:"source"`
	ReviewDate string    `json:"review_date"`
	TechKey    *string   `json:"tech_key"`
	Rating     *int16    `json:"rating"`
	Transcript string    `json:"transcript"`
	// Transcripts are not translated, the page marks them with this lang (FR-115)
	Lang  string `json:"lang"`
	Image Image  `json:"image"`
}

type AdminTestimonial struct {
	Testimonial
	BlurredConfirmed bool      `json:"blurred_confirmed"`
	Published        bool      `json:"published"`
	CreatedAt        time.Time `json:"created_at"`
}

func NewTestimonial(t sqlc.Testimonial) Testimonial {
	return Testimonial{
		ID:         t.ID,
		Source:     t.Source,
		ReviewDate: t.ReviewDate.Format(dateLayout),
		TechKey:    t.TechKey,
		Rating:     t.Rating,
		Transcript: t.Transcript,
		Lang:       t.Lang,
		Image:      newImage(t.ImageKey, t.Width, t.Height),
	}
}

func NewAdminTestimonial(t sqlc.Testimonial) AdminTestimonial {
	return AdminTestimonial{
		Testimonial:      NewTestimonial(t),
		BlurredConfirmed: t.BlurredConfirmed,
		Published:        t.Published,
		CreatedAt:        t.CreatedAt,
	}
}

type SizeChart struct {
	Key       string    `json:"key"`
	Title     string    `json:"title"`
	Rows      string    `json:"rows"`
	Note      string    `json:"note"`
	UpdatedAt time.Time `json:"updated_at"`
}

func NewSizeChart(s sqlc.SizeChart) SizeChart {
	return SizeChart{Key: s.Key, Title: s.Title, Rows: s.Rows, Note: s.Note, UpdatedAt: s.UpdatedAt}
}

// MapSlice keeps empty results as [] in JSON instead of null.
func MapSlice[A, B any](in []A, f func(A) B) []B {
	out := make([]B, 0, len(in))
	for _, v := range in {
		out = append(out, f(v))
	}
	return out
}
