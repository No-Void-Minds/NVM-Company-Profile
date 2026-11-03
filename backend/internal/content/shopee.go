package content

import (
	"errors"
	"net/url"
	"strings"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db/sqlc"
)

// ShopeeHost is the only host a buy link may point to (FR-136).
const ShopeeHost = "shopee.co.id"

const maxLinkLength = 2048

// ValidateShopeeURL accepts an empty value (no link) or an https link on shopee.co.id.
// The link is stored as typed: collection links need their ?shopCollection= query.
func ValidateShopeeURL(raw string) error {
	if raw == "" {
		return nil
	}
	if len(raw) > maxLinkLength {
		return errors.New("link terlalu panjang")
	}
	// Browsers read a backslash as a slash, Go does not, so the two could see different hosts
	if strings.ContainsAny(raw, "\\ \t\r\n") {
		return errors.New("link tidak boleh memuat spasi atau backslash")
	}
	for _, r := range raw {
		if r < 0x20 || r == 0x7f {
			return errors.New("link memuat karakter kontrol")
		}
	}
	u, err := url.Parse(raw)
	if err != nil {
		return errors.New("link tidak bisa dibaca")
	}
	if u.Scheme != "https" {
		return errors.New("link harus diawali https://")
	}
	if u.User != nil || u.Host != ShopeeHost {
		return errors.New("link harus ke " + ShopeeHost)
	}
	return nil
}

type TechLink struct {
	Fit *string `json:"fit"`
	URL string  `json:"url"`
}

// Tech is a tech row with its Shopee links, in fit order.
type Tech struct {
	sqlc.ListTechsByLangRow
	Links []TechLink `json:"links"`
}

func NewTechs(rows []sqlc.ListTechsByLangRow, links []sqlc.TechLink) []Tech {
	byTech := map[string][]TechLink{}
	for _, l := range links {
		byTech[l.TechKey] = append(byTech[l.TechKey], TechLink{Fit: l.Fit, URL: l.Url})
	}
	out := make([]Tech, len(rows))
	for i, r := range rows {
		out[i] = Tech{ListTechsByLangRow: r, Links: byTech[r.Key]}
		if out[i].Links == nil {
			out[i].Links = []TechLink{}
		}
	}
	return out
}
