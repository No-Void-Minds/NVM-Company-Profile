package content

import (
	"fmt"
	"regexp"
	"strings"
)

var sizeChartKey = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)

func ValidSizeChartKey(key string) bool {
	return len(key) <= 80 && sizeChartKey.MatchString(key)
}

// ValidateChartRows checks the pipe format: one header line and at
// least one size line, all with the same number of columns.
func ValidateChartRows(rows string) error {
	lines := strings.Split(strings.ReplaceAll(strings.TrimSpace(rows), "\r\n", "\n"), "\n")
	if len(lines) < 2 {
		return fmt.Errorf("isi minimal satu baris judul kolom dan satu baris ukuran")
	}
	columns := strings.Count(lines[0], "|") + 1
	if columns < 2 {
		return fmt.Errorf("kolom dipisah tanda |")
	}
	for i, line := range lines {
		cells := strings.Split(line, "|")
		if len(cells) != columns {
			return fmt.Errorf("baris %d punya %d kolom, seharusnya %d", i+1, len(cells), columns)
		}
		for _, cell := range cells {
			if strings.TrimSpace(cell) == "" {
				return fmt.Errorf("baris %d punya kolom kosong", i+1)
			}
		}
	}
	return nil
}
