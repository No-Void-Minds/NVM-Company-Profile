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
