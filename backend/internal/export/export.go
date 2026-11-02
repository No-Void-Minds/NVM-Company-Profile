// Package export writes inquiry data as CSV and XLSX.
package export

import (
	"encoding/csv"
	"io"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db/sqlc"
)

// A fixed offset, because distroless images ship no time zone database.
var jakarta = time.FixedZone("WIB", 7*60*60)

const timeLayout = "2006-01-02 15:04:05"

// ip_hash and idempotency_key are left out: SRS 8 keeps the hash for rate limiting only.
var header = []string{
	"ID", "Kode", "Jenis", "Nama", "Usaha atau komunitas", "Kota", "WhatsApp", "Email",
	"Kanal penjualan", "Tech diminati", "Perkiraan jumlah", "Pesan", "Status",
	"Persetujuan (WIB)", "Dibuat (WIB)",
}

const phoneColumn = 6

func row(in sqlc.Inquiry) []string {
	return []string{
		in.ID.String(), in.Code, in.Kind, in.Name, in.Org, in.City, in.Phone, in.Email,
		in.Channels, strings.Join(in.Techs, ", "), in.QuantityNote, in.Message, in.Status,
		in.ConsentAt.In(jakarta).Format(timeLayout), in.CreatedAt.In(jakarta).Format(timeLayout),
	}
}

// FileName builds inquiries-YYYYMMDD.<ext> from the Jakarta date.
func FileName(now time.Time, ext string) string {
	return "inquiries-" + now.In(jakarta).Format("20060102") + "." + ext
}

// Public form input ends up in a spreadsheet, so text must not run as a formula.
func safeCSVCell(value string) string {
	if value != "" && strings.ContainsRune("=+-@\t\r", rune(value[0])) {
		return "'" + value
	}
	return value
}

// Excel would read 0812... as a number and drop the zero. The value is already
// validated as digits and a plus sign, so wrapping it cannot inject anything.
func csvPhone(phone string) string {
	if phone == "" {
		return ""
	}
	return `="` + phone + `"`
}

func WriteCSV(w io.Writer, inquiries []sqlc.Inquiry) error {
	// The BOM makes Excel read the file as UTF-8.
	if _, err := w.Write([]byte{0xEF, 0xBB, 0xBF}); err != nil {
		return err
	}
	out := csv.NewWriter(w)
	// Excel on an Indonesian list separator reads a comma file as one column. A sep= hint
	// would fix that but makes Excel ignore the BOM and garble accents, tested on Excel 16.
	out.Comma = ';'
	if err := out.Write(header); err != nil {
		return err
	}
	for _, in := range inquiries {
		cells := row(in)
		for i, cell := range cells {
			if i == phoneColumn {
				cells[i] = csvPhone(cell)
			} else {
				cells[i] = safeCSVCell(cell)
			}
		}
		if err := out.Write(cells); err != nil {
			return err
		}
	}
	out.Flush()
	return out.Error()
}

// WriteXLSX stores every cell as a string, so nothing is evaluated as a formula.
func WriteXLSX(w io.Writer, inquiries []sqlc.Inquiry) error {
	const sheet = "Inquiry"

	f := excelize.NewFile()
	defer f.Close()
	if err := f.SetSheetName("Sheet1", sheet); err != nil {
		return err
	}
	if err := writeSheetRow(f, sheet, 1, header); err != nil {
		return err
	}
	for i, in := range inquiries {
		if err := writeSheetRow(f, sheet, i+2, row(in)); err != nil {
			return err
		}
	}
	_, err := f.WriteTo(w)
	return err
}

func writeSheetRow(f *excelize.File, sheet string, rowIndex int, cells []string) error {
	for col, value := range cells {
		name, err := excelize.CoordinatesToCellName(col+1, rowIndex)
		if err != nil {
			return err
		}
		if err := f.SetCellStr(sheet, name, value); err != nil {
			return err
		}
	}
	return nil
}
