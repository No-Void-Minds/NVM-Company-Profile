package media

import (
	"encoding/binary"
	"image"
	"image/draw"
)

// Re-encoding drops the EXIF orientation flag, so phone photos would turn sideways
// unless the rotation is baked into the pixels first.
func jpegOrientation(data []byte) int {
	const startOfScan = 0xDA

	i := 2
	for i+4 <= len(data) {
		if data[i] != 0xFF {
			return 1
		}
		marker := data[i+1]
		if marker == startOfScan {
			return 1
		}
		size := int(binary.BigEndian.Uint16(data[i+2:]))
		end := i + 2 + size
		if size < 2 || end > len(data) {
			return 1
		}
		if marker == 0xE1 && size > 8 && string(data[i+4:i+10]) == "Exif\x00\x00" {
			return tiffOrientation(data[i+10 : end])
		}
		i = end
	}
	return 1
}

func tiffOrientation(tiff []byte) int {
	const (
		tagOrientation = 0x0112
		entrySize      = 12
	)
	if len(tiff) < 8 {
		return 1
	}
	var order binary.ByteOrder
	switch string(tiff[:2]) {
	case "II":
		order = binary.LittleEndian
	case "MM":
		order = binary.BigEndian
	default:
		return 1
	}

	ifd := int(order.Uint32(tiff[4:]))
	if ifd < 8 || ifd+2 > len(tiff) {
		return 1
	}
	count := int(order.Uint16(tiff[ifd:]))
	for n := range count {
		entry := ifd + 2 + n*entrySize
		if entry+entrySize > len(tiff) {
			return 1
		}
		if order.Uint16(tiff[entry:]) == tagOrientation {
			value := int(order.Uint16(tiff[entry+8:]))
			if value >= 1 && value <= 8 {
				return value
			}
			return 1
		}
	}
	return 1
}

func applyOrientation(src image.Image, orientation int) image.Image {
	if orientation <= 1 || orientation > 8 {
		return src
	}
	b := src.Bounds()
	w, h := b.Dx(), b.Dy()
	flat := image.NewNRGBA(image.Rect(0, 0, w, h))
	draw.Draw(flat, flat.Bounds(), src, b.Min, draw.Src)

	dstW, dstH := w, h
	if orientation >= 5 {
		dstW, dstH = h, w
	}
	dst := image.NewNRGBA(image.Rect(0, 0, dstW, dstH))
	for y := range h {
		for x := range w {
			dx, dy := orientedPoint(orientation, x, y, w, h)
			si := flat.PixOffset(x, y)
			di := dst.PixOffset(dx, dy)
			copy(dst.Pix[di:di+4], flat.Pix[si:si+4])
		}
	}
	return dst
}

func orientedPoint(orientation, x, y, w, h int) (int, int) {
	switch orientation {
	case 2:
		return w - 1 - x, y
	case 3:
		return w - 1 - x, h - 1 - y
	case 4:
		return x, h - 1 - y
	case 5:
		return y, x
	case 6:
		return h - 1 - y, x
	case 7:
		return h - 1 - y, w - 1 - x
	case 8:
		return y, w - 1 - x
	}
	return x, y
}
