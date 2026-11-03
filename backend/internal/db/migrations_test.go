package db

import (
	"encoding/json"
	"os"
	"regexp"
	"strings"
	"testing"
)

func readFile(t *testing.T, path string) string {
	t.Helper()
	b, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	return string(b)
}

// 0003 runs on a production database that already has data, so its up step may only add.
func TestMigration0003OnlyAdds(t *testing.T) {
	up := strings.ToUpper(readFile(t, "../../migrations/0003_i18n.up.sql"))
	// Statement starts only: "ON DELETE CASCADE" on a foreign key is not a delete.
	destructive := regexp.MustCompile(`(?m)^\s*(DROP|DELETE|TRUNCATE|UPDATE)\b|DROP COLUMN|ALTER COLUMN`)
	if found := destructive.FindAllString(up, -1); len(found) > 0 {
		t.Errorf("0003 up memuat perintah yang mengubah data lama: %q", found)
	}
	if got := strings.Count(up, "ON CONFLICT DO NOTHING"); got != 2 {
		t.Errorf("kedua INSERT harus ON CONFLICT DO NOTHING, ada %d", got)
	}
	for _, column := range regexp.MustCompile(`ADD COLUMN (\w+) [^,;]*`).FindAllString(up, -1) {
		if !strings.Contains(column, "DEFAULT") {
			t.Errorf("kolom baru tanpa default akan gagal di tabel berisi: %s", column)
		}
	}
}

func TestMigration0003DownUndoesUp(t *testing.T) {
	down := readFile(t, "../../migrations/0003_i18n.down.sql")
	for _, want := range []string{"DROP TABLE tech_i18n", "DROP COLUMN lang", "DROP COLUMN caption_en", "DROP COLUMN alt_en"} {
		if !strings.Contains(down, want) {
			t.Errorf("0003 down tidak memuat %q", want)
		}
	}
}

// 0004 also runs on production data: it only adds, and the gate starts enabled.
func TestMigration0004(t *testing.T) {
	up := strings.ToUpper(readFile(t, "../../migrations/0004_site_settings.up.sql"))
	destructive := regexp.MustCompile(`(?m)^\s*(DROP|DELETE|TRUNCATE|UPDATE|ALTER)\b`)
	if found := destructive.FindAllString(up, -1); len(found) > 0 {
		t.Errorf("0004 up memuat %q", found)
	}
	if !strings.Contains(up, `('PASSWORD_GATE', '{"ENABLED": TRUE}')`) {
		t.Error("baris awal password_gate harus enabled true")
	}
	if !strings.Contains(up, "ON CONFLICT DO NOTHING") {
		t.Error("INSERT 0004 harus ON CONFLICT DO NOTHING")
	}
	if down := readFile(t, "../../migrations/0004_site_settings.down.sql"); !strings.Contains(down, "DROP TABLE site_settings") {
		t.Error("0004 down harus menghapus site_settings")
	}
}

// Same promise as 0002: the migration holds exactly what the seed JSON says.
func TestMigration0003MatchesSeed(t *testing.T) {
	up := readFile(t, "../../migrations/0003_i18n.up.sql")
	var rows []struct {
		Key         string   `json:"key"`
		Tagline     string   `json:"tagline"`
		Sub         string   `json:"sub"`
		Description string   `json:"description"`
		Chips       []string `json:"chips"`
	}
	if err := json.Unmarshal([]byte(readFile(t, "seed/techs_id.json")), &rows); err != nil {
		t.Fatal(err)
	}
	if len(rows) != 11 {
		t.Fatalf("techs_id.json harus 11 tech, ada %d", len(rows))
	}
	quote := func(s string) string { return "'" + strings.ReplaceAll(s, "'", "''") + "'" }
	for _, r := range rows {
		chips := make([]string, len(r.Chips))
		for i, c := range r.Chips {
			chips[i] = quote(c)
		}
		line := "(" + strings.Join([]string{
			quote(r.Key), quote(r.Tagline), quote(r.Sub), quote(r.Description),
			"ARRAY[" + strings.Join(chips, ", ") + "]::text[]",
		}, ", ") + ")"
		if !strings.Contains(up, line) {
			t.Errorf("0003 tidak sama dengan seed untuk %s", r.Key)
		}
	}
}

// 0005 runs on production data: only adds, keeps on_rack, and its one UPDATE hides MELTWRAP.
func TestMigration0005(t *testing.T) {
	up := readFile(t, "../../migrations/0005_shopee_links.up.sql")
	upper := strings.ToUpper(up)
	destructive := regexp.MustCompile(`(?m)^s*(DROP|DELETE|TRUNCATE)|DROP COLUMN|ALTER COLUMN`)
	if found := destructive.FindAllString(upper, -1); len(found) > 0 {
		t.Errorf("0005 up memuat %q", found)
	}
	updates := regexp.MustCompile(`(?m)^s*UPDATE .*$`).FindAllString(up, -1)
	if len(updates) != 1 || updates[0] != "UPDATE techs SET visible = false WHERE key = 'meltwrap';" {
		t.Errorf("satu-satunya UPDATE harus menyembunyikan meltwrap, ada %q", updates)
	}
	if strings.Contains(strings.ToLower(up), "on_rack") && !strings.Contains(up, "tidak menyentuh on_rack") {
		t.Error("0005 tidak boleh mengubah on_rack")
	}
	if !strings.Contains(up, "ADD COLUMN visible boolean NOT NULL DEFAULT true") {
		t.Error("techs.visible harus default true agar tech lama tetap tampil")
	}
	if !strings.Contains(upper, "ON CONFLICT DO NOTHING") {
		t.Error("INSERT link harus ON CONFLICT DO NOTHING")
	}

	var links []struct {
		TechKey string  `json:"tech_key"`
		Fit     *string `json:"fit"`
		URL     string  `json:"url"`
	}
	if err := json.Unmarshal([]byte(readFile(t, "seed/tech_links.json")), &links); err != nil {
		t.Fatal(err)
	}
	if len(links) != 21 {
		t.Fatalf("tech_links.json harus 21 link, ada %d", len(links))
	}
	for _, l := range links {
		fit := "NULL"
		if l.Fit != nil {
			fit = "'" + *l.Fit + "'"
		}
		if !strings.Contains(up, "('"+l.TechKey+"', "+fit+", '"+l.URL+"', ") {
			t.Errorf("0005 tidak sama dengan seed untuk %s %s", l.TechKey, fit)
		}
		if strings.Contains(l.URL, "?") || !strings.HasPrefix(l.URL, "https://shopee.co.id/") {
			t.Errorf("link seed harus bersih tanpa query: %s", l.URL)
		}
		if l.TechKey == "aezy" && l.Fit != nil && *l.Fit == "Fitted" {
			t.Error("aezy Fitted belum punya link")
		}
	}

	down := readFile(t, "../../migrations/0005_shopee_links.down.sql")
	for _, want := range []string{"DROP TABLE tech_links", "DROP COLUMN url", "DROP COLUMN visible"} {
		if !strings.Contains(down, want) {
			t.Errorf("0005 down tidak memuat %q", want)
		}
	}
}

// The public API and the Lab index skip hidden techs (FR-134). Checked on the SQL that sqlc ran.
func TestHiddenTechsLeftOutOfPublicQueries(t *testing.T) {
	queries := readFile(t, "queries/content.sql")
	for _, want := range []string{
		"WHERE t.visible OR @include_hidden::boolean",
		"FROM techs WHERE visible;",
	} {
		if !strings.Contains(queries, want) {
			t.Errorf("content.sql tidak memuat %q", want)
		}
	}
}
