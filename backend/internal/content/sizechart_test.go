package content

import "testing"

func TestValidateChartRows(t *testing.T) {
	const header = "Size | Width | Height*\n"
	cases := []struct {
		name string
		rows string
		ok   bool
	}{
		{"valid", header + "S | 48 | < 160\nM | 51 | 160-170", true},
		{"pemisah en dash", header + "M | 51 | 160–170", true},
		{"baris CRLF", "Size | Width\r\nS | 48\r\n", true},
		{"hanya judul", "Size | Width", false},
		{"kosong", "", false},
		{"tanpa pemisah", "Size\nS", false},
		{"jumlah kolom beda", header + "S | 48", false},
		{"kolom kosong", header + "S |  | < 160", false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if err := ValidateChartRows(tc.rows); (err == nil) != tc.ok {
				t.Fatalf("hasil salah: %v", err)
			}
		})
	}
}

func TestValidSizeChartKey(t *testing.T) {
	for _, key := range []string{"aezy-regular", "antshell", "curflex-mini-fitted", "aezy-2-regular"} {
		if !ValidSizeChartKey(key) {
			t.Errorf("%s seharusnya valid", key)
		}
	}
	for _, key := range []string{"", "AEZY", "aezy_regular", "-aezy", "aezy-", "a b", "../x"} {
		if ValidSizeChartKey(key) {
			t.Errorf("%q seharusnya ditolak", key)
		}
	}
}
