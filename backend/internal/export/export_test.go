package export

import (
	"bytes"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db/sqlc"
)

func sample() sqlc.Inquiry {
	at := time.Date(2026, 11, 2, 17, 30, 0, 0, time.UTC)
	return sqlc.Inquiry{
		ID:        uuid.MustParse("7f6c1f6e-6d3b-4a53-9d0e-0a5f0f7a1b11"),
		Code:      "B2B-7KQ4M2",
		Kind:      "wholesale",
		Name:      "UJI André",
		Org:       "+Toko",
		City:      "Bandung",
		Phone:     "081234567890",
		Techs:     []string{"aezy", "curflex"},
		Message:   `=HYPERLINK("http://x")`,
		Status:    "new",
		ConsentAt: at,
		CreatedAt: at,
	}
}

func TestWriteCSV(t *testing.T) {
	var out bytes.Buffer
	if err := WriteCSV(&out, []sqlc.Inquiry{sample()}); err != nil {
		t.Fatal(err)
	}
	text := out.String()
	if !strings.HasPrefix(text, "\xEF\xBB\xBFID;Kode;Jenis;Nama;") {
		t.Fatalf("harus BOM lalu pemisah titik koma: %q", text[:30])
	}
	for _, want := range []string{
		`"=""081234567890"""`,         // Excel must keep the leading zero
		`"'=HYPERLINK(""http://x"")"`, // formula neutralized
		"'+Toko",                      // same for a leading plus
		"aezy, curflex",
		"UJI André",
		"2026-11-03 00:30:00", // 17:30 UTC is past midnight in Jakarta
	} {
		if !strings.Contains(text, want) {
			t.Errorf("CSV tidak memuat %s:\n%s", want, text)
		}
	}
	for _, leaked := range []string{"ip_hash", "idempotency"} {
		if strings.Contains(strings.ToLower(text), leaked) {
			t.Errorf("CSV tidak boleh memuat %s", leaked)
		}
	}
}

func TestWriteXLSXKeepsEveryCellAsText(t *testing.T) {
	var out bytes.Buffer
	if err := WriteXLSX(&out, []sqlc.Inquiry{sample()}); err != nil {
		t.Fatal(err)
	}
	f, err := excelize.OpenReader(&out)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	rows, err := f.GetRows("Inquiry")
	if err != nil {
		t.Fatal(err)
	}
	if len(rows) != 2 || len(rows[0]) != len(header) {
		t.Fatalf("bentuk sheet salah: %d baris, %d kolom", len(rows), len(rows[0]))
	}
	if rows[1][phoneColumn] != "081234567890" {
		t.Fatalf("WhatsApp kehilangan nol: %q", rows[1][phoneColumn])
	}
	formula, err := f.GetCellFormula("Inquiry", "L2")
	if err != nil || formula != "" {
		t.Fatalf("pesan tidak boleh jadi formula: %q %v", formula, err)
	}
}

func TestFileNameUsesJakartaDate(t *testing.T) {
	late := time.Date(2026, 11, 2, 18, 0, 0, 0, time.UTC)
	if got := FileName(late, "csv"); got != "inquiries-20261103.csv" {
		t.Fatalf("nama file %s", got)
	}
}
