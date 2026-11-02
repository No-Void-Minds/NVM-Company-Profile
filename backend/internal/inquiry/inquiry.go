// Package inquiry holds B2B inquiry rules: validation, codes, and IP hashing.
package inquiry

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"net/mail"
	"regexp"
	"strings"
	"unicode/utf8"
)

type Input struct {
	Kind         string   `json:"kind"`
	Name         string   `json:"name"`
	Org          string   `json:"org"`
	City         string   `json:"city"`
	Phone        string   `json:"phone"`
	Email        string   `json:"email"`
	Channels     string   `json:"channels"`
	Techs        []string `json:"techs"`
	QuantityNote string   `json:"quantity_note"`
	Message      string   `json:"message"`
	Consent      bool     `json:"consent"`
	Website      string   `json:"website"`
}

var (
	phonePattern   = regexp.MustCompile(`^(08|\+62)[0-9]+$`)
	phoneSeparator = strings.NewReplacer(" ", "", "-", "", "(", "", ")", "", ".", "")
	techKeyPattern = regexp.MustCompile(`^[a-z0-9-]{1,40}$`)
)

// Clean trims the input and returns it with per-field messages for anything invalid (FR-42).
func (in Input) Clean() (Input, map[string]string) {
	out := in
	out.Name = strings.TrimSpace(in.Name)
	out.Org = strings.TrimSpace(in.Org)
	out.City = strings.TrimSpace(in.City)
	out.Phone = phoneSeparator.Replace(strings.TrimSpace(in.Phone))
	out.Email = strings.TrimSpace(in.Email)
	out.Channels = strings.TrimSpace(in.Channels)
	out.QuantityNote = strings.TrimSpace(in.QuantityNote)
	out.Message = strings.TrimSpace(in.Message)
	if out.Techs == nil {
		out.Techs = []string{}
	}

	fields := map[string]string{}
	if out.Kind != "wholesale" && out.Kind != "collaboration" {
		fields["kind"] = "Pilih jenis kerja sama."
	}
	if n := utf8.RuneCountInString(out.Name); n < 2 || n > 80 {
		fields["name"] = "Nama harus 2 sampai 80 karakter."
	}
	if n := utf8.RuneCountInString(out.Org); n < 2 || n > 120 {
		fields["org"] = "Nama usaha atau komunitas harus 2 sampai 120 karakter."
	}
	if n := utf8.RuneCountInString(out.City); n < 2 || n > 80 {
		fields["city"] = "Kota harus 2 sampai 80 karakter."
	}
	if out.Phone != "" && !validPhone(out.Phone) {
		fields["phone"] = "Nomor WhatsApp harus diawali 08 atau +62, 10 sampai 15 digit."
	}
	if out.Email != "" && !validEmail(out.Email) {
		fields["email"] = "Format email belum benar."
	}
	if out.Phone == "" && out.Email == "" {
		fields["phone"] = "Isi WhatsApp atau email, salah satu cukup."
	}
	if utf8.RuneCountInString(out.Channels) > 200 {
		fields["channels"] = "Kanal penjualan maksimal 200 karakter."
	}
	if utf8.RuneCountInString(out.QuantityNote) > 200 {
		fields["quantity_note"] = "Perkiraan jumlah maksimal 200 karakter."
	}
	if !validTechKeys(out.Techs) {
		fields["techs"] = "Pilihan tech tidak dikenal."
	}
	if n := utf8.RuneCountInString(out.Message); n < 10 || n > 1000 {
		fields["message"] = "Pesan harus 10 sampai 1000 karakter."
	}
	if !out.Consent {
		fields["consent"] = "Centang persetujuan agar kami bisa memproses data ini."
	}
	return out, fields
}

func validPhone(phone string) bool {
	if !phonePattern.MatchString(phone) {
		return false
	}
	digits := len(strings.TrimPrefix(phone, "+"))
	return digits >= 10 && digits <= 15
}

func validEmail(email string) bool {
	if len(email) > 254 {
		return false
	}
	addr, err := mail.ParseAddress(email)
	return err == nil && addr.Address == email
}

func validTechKeys(keys []string) bool {
	if len(keys) > 20 {
		return false
	}
	for _, key := range keys {
		if !techKeyPattern.MatchString(key) {
			return false
		}
	}
	return true
}

// Crockford base32 leaves out I, L, O, and U so codes survive being read aloud.
const crockford = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

func NewCode() (string, error) {
	buf := make([]byte, 6)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	for i, b := range buf {
		buf[i] = crockford[b&31]
	}
	return "B2B-" + string(buf), nil
}

func HashIP(salt, ip string) string {
	sum := sha256.Sum256([]byte(salt + "|" + ip))
	return hex.EncodeToString(sum[:])
}
