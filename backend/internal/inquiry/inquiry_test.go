package inquiry

import (
	"regexp"
	"strings"
	"testing"
)

func validInput() Input {
	return Input{
		Kind:    "wholesale",
		Name:    "UJI Budi",
		Org:     "Toko Uji",
		City:    "Bandung",
		Phone:   "081234567890",
		Message: "Pesan uji yang cukup panjang.",
		Consent: true,
	}
}

func TestCleanAcceptsValidInput(t *testing.T) {
	if _, fields := validInput().Clean(); len(fields) != 0 {
		t.Fatalf("input valid ditolak: %v", fields)
	}
}

func TestCleanFieldRules(t *testing.T) {
	cases := []struct {
		name   string
		mutate func(*Input)
		field  string
	}{
		{"jenis tidak dikenal", func(i *Input) { i.Kind = "retail" }, "kind"},
		{"nama 1 karakter", func(i *Input) { i.Name = "A" }, "name"},
		{"nama 81 karakter", func(i *Input) { i.Name = strings.Repeat("a", 81) }, "name"},
		{"usaha kosong", func(i *Input) { i.Org = " " }, "org"},
		{"kota kosong", func(i *Input) { i.City = "" }, "city"},
		{"telepon awalan salah", func(i *Input) { i.Phone = "0712345678" }, "phone"},
		{"telepon tanpa plus", func(i *Input) { i.Phone = "6281234567890" }, "phone"},
		{"telepon 9 digit", func(i *Input) { i.Phone = "081234567" }, "phone"},
		{"telepon 16 digit", func(i *Input) { i.Phone = "0812345678901234" }, "phone"},
		{"email salah", func(i *Input) { i.Email = "bukan-email" }, "email"},
		{"tanpa kontak", func(i *Input) { i.Phone = ""; i.Email = "" }, "phone"},
		{"pesan 9 karakter", func(i *Input) { i.Message = "123456789" }, "message"},
		{"pesan 1001 karakter", func(i *Input) { i.Message = strings.Repeat("a", 1001) }, "message"},
		{"tanpa persetujuan", func(i *Input) { i.Consent = false }, "consent"},
		{"key tech aneh", func(i *Input) { i.Techs = []string{"../x"} }, "techs"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			in := validInput()
			tc.mutate(&in)
			if _, fields := in.Clean(); fields[tc.field] == "" {
				t.Fatalf("field %s seharusnya ditolak, dapat %v", tc.field, fields)
			}
		})
	}
}

func TestCleanAcceptedVariants(t *testing.T) {
	cases := []struct {
		name   string
		mutate func(*Input)
	}{
		{"telepon 10 digit", func(i *Input) { i.Phone = "0812345678" }},
		{"telepon 15 digit", func(i *Input) { i.Phone = "081234567890123" }},
		{"telepon +62", func(i *Input) { i.Phone = "+6281234567890" }},
		{"telepon dengan pemisah", func(i *Input) { i.Phone = "0812-3456 7890" }},
		{"email tanpa telepon", func(i *Input) { i.Phone = ""; i.Email = "uji@example.com" }},
		{"nama multibyte 80 karakter", func(i *Input) { i.Name = strings.Repeat("é", 80) }},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			in := validInput()
			tc.mutate(&in)
			if _, fields := in.Clean(); len(fields) != 0 {
				t.Fatalf("seharusnya diterima: %v", fields)
			}
		})
	}
}

func TestCleanNormalizes(t *testing.T) {
	in := validInput()
	in.Name = "  UJI Budi  "
	in.Phone = "0812-3456 7890"
	out, _ := in.Clean()
	if out.Name != "UJI Budi" || out.Phone != "081234567890" {
		t.Fatalf("normalisasi salah: %q %q", out.Name, out.Phone)
	}
	if out.Techs == nil {
		t.Fatal("Techs nil akan melanggar NOT NULL di database")
	}
}

func TestNewCodeFormat(t *testing.T) {
	pattern := regexp.MustCompile(`^B2B-[0-9A-HJKMNP-TV-Z]{6}$`)
	seen := map[string]bool{}
	for range 500 {
		code, err := NewCode()
		if err != nil {
			t.Fatal(err)
		}
		if !pattern.MatchString(code) {
			t.Fatalf("format kode salah: %s", code)
		}
		seen[code] = true
	}
	if len(seen) < 495 {
		t.Fatalf("kode terlalu sering sama: %d unik dari 500", len(seen))
	}
}

func TestHashIP(t *testing.T) {
	a := HashIP("garam", "10.0.0.1")
	if a != HashIP("garam", "10.0.0.1") {
		t.Fatal("hash harus stabil")
	}
	if a == HashIP("garam-lain", "10.0.0.1") || a == HashIP("garam", "10.0.0.2") {
		t.Fatal("hash harus bergantung pada salt dan IP")
	}
	if strings.Contains(a, "10.0.0.1") || len(a) != 64 {
		t.Fatalf("hash tidak sesuai SHA-256 hex: %s", a)
	}
}
