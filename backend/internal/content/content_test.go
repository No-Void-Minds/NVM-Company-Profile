package content

import (
	"testing"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db/sqlc"
)

// FR-115: English text when it is filled in, otherwise the Indonesian one.
func TestNewGalleryItemLanguage(t *testing.T) {
	both := sqlc.GalleryItem{Alt: "Foto produksi", Caption: "Ruang potong", AltEn: "Production photo", CaptionEn: "Cutting room"}
	onlyID := sqlc.GalleryItem{Alt: "Foto produksi", Caption: "Ruang potong"}

	for _, tc := range []struct {
		name    string
		item    sqlc.GalleryItem
		lang    string
		alt     string
		caption string
	}{
		{"id memakai teks id", both, LangID, "Foto produksi", "Ruang potong"},
		{"en memakai teks en", both, LangEN, "Production photo", "Cutting room"},
		{"en kosong kembali ke id", onlyID, LangEN, "Foto produksi", "Ruang potong"},
	} {
		got := NewGalleryItem(tc.item, tc.lang)
		if got.Alt != tc.alt || got.Caption != tc.caption {
			t.Errorf("%s: dapat %q, %q", tc.name, got.Alt, got.Caption)
		}
	}
}
