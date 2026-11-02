// Package media validates uploads and stores them as WebP variants.
package media

import (
	"bytes"
	"errors"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"os"
	"path/filepath"
	"regexp"

	"github.com/gen2brain/webp"
	"github.com/google/uuid"
	"golang.org/x/image/draw"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/content"
)

const (
	MaxUploadBytes = 8 << 20

	// Stops decompression bombs: a small file can still claim a huge canvas.
	maxPixels = 50_000_000

	webpQuality = 80
)

var (
	ErrUnsupported = errors.New("file harus berupa JPG, PNG, atau WebP")
	ErrTooLarge    = errors.New("dimensi gambar terlalu besar")

	variantName = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-(480|960|1600)\.webp$`)
)

type Store struct {
	dir string
	// Decoding and encoding are memory heavy, so uploads run one at a time.
	slot chan struct{}
}

type Stored struct {
	Key    uuid.UUID
	Width  int32
	Height int32
}

func NewStore(dir string) (*Store, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, fmt.Errorf("membuat folder media: %w", err)
	}
	return &Store{dir: dir, slot: make(chan struct{}, 1)}, nil
}

type format int

const (
	formatUnknown format = iota
	formatJPEG
	formatPNG
	formatWebP
)

// Sniff trusts file content only, the name and Content-Type are client input (NFR-07).
func sniff(data []byte) format {
	switch {
	case bytes.HasPrefix(data, []byte{0xFF, 0xD8, 0xFF}):
		return formatJPEG
	case bytes.HasPrefix(data, []byte{0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A}):
		return formatPNG
	case len(data) >= 12 && string(data[:4]) == "RIFF" && string(data[8:12]) == "WEBP":
		return formatWebP
	}
	return formatUnknown
}

func decode(data []byte) (image.Image, error) {
	r := bytes.NewReader(data)
	var (
		cfg image.Config
		err error
	)
	kind := sniff(data)
	switch kind {
	case formatJPEG:
		cfg, err = jpeg.DecodeConfig(r)
	case formatPNG:
		cfg, err = png.DecodeConfig(r)
	case formatWebP:
		cfg, err = webp.DecodeConfig(r)
	default:
		return nil, ErrUnsupported
	}
	if err != nil {
		return nil, ErrUnsupported
	}
	if cfg.Width <= 0 || cfg.Height <= 0 || cfg.Width > maxPixels/cfg.Height {
		return nil, ErrTooLarge
	}

	r = bytes.NewReader(data)
	var img image.Image
	switch kind {
	case formatJPEG:
		if img, err = jpeg.Decode(r); err == nil {
			img = applyOrientation(img, jpegOrientation(data))
		}
	case formatPNG:
		img, err = png.Decode(r)
	case formatWebP:
		img, err = webp.Decode(r, webp.Options{AutoRotate: true})
	}
	if err != nil {
		return nil, ErrUnsupported
	}
	return img, nil
}

// Save re-encodes the image, which is what drops EXIF and any other metadata.
func (s *Store) Save(data []byte) (Stored, error) {
	s.slot <- struct{}{}
	defer func() { <-s.slot }()

	img, err := decode(data)
	if err != nil {
		return Stored{}, err
	}

	key := uuid.New()
	bounds := img.Bounds()
	for _, width := range content.VariantWidths {
		if err := s.writeVariant(key, width, img); err != nil {
			s.Remove(key)
			return Stored{}, err
		}
	}
	return Stored{Key: key, Width: int32(bounds.Dx()), Height: int32(bounds.Dy())}, nil
}

func (s *Store) writeVariant(key uuid.UUID, width int, src image.Image) error {
	target := filepath.Join(s.dir, content.VariantName(key, width))
	tmp := target + ".tmp"
	f, err := os.Create(tmp)
	if err != nil {
		return err
	}
	defer os.Remove(tmp)

	if err := webp.Encode(f, resize(src, width), webp.Options{Quality: webpQuality}); err != nil {
		_ = f.Close()
		return err
	}
	if err := f.Close(); err != nil {
		return err
	}
	return os.Rename(tmp, target)
}

// Narrow sources keep their size. The srcset still lists every width, and the
// browser only ends up with a softer choice, never a broken link.
func resize(src image.Image, width int) image.Image {
	b := src.Bounds()
	if b.Dx() <= width {
		return src
	}
	height := max(1, b.Dy()*width/b.Dx())
	dst := image.NewNRGBA(image.Rect(0, 0, width, height))
	draw.CatmullRom.Scale(dst, dst.Bounds(), src, b, draw.Src, nil)
	return dst
}

func (s *Store) Remove(key uuid.UUID) {
	for _, width := range content.VariantWidths {
		_ = os.Remove(filepath.Join(s.dir, content.VariantName(key, width)))
	}
}

// Path resolves a public file name, or false when it is not one of ours.
func (s *Store) Path(name string) (string, bool) {
	if !variantName.MatchString(name) {
		return "", false
	}
	return filepath.Join(s.dir, name), true
}
