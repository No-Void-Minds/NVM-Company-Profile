package content

import "testing"

func TestValidateShopeeURL(t *testing.T) {
	ok := []string{
		"",
		"https://shopee.co.id/novoidminds",
		"https://shopee.co.id/No-Void-Minds-AEZY-Regular-T-Shirt-Core-i.462123491.25438116155",
		"https://shopee.co.id/novoidminds?shopCollection=123456789",
		"https://shopee.co.id/novoidminds?shopCollection=1&sp_atk=abc#produk",
	}
	for _, raw := range ok {
		if err := ValidateShopeeURL(raw); err != nil {
			t.Errorf("%q harus diterima: %v", raw, err)
		}
	}
	bad := []string{
		"javascript:alert(1)",
		"JavaScript://shopee.co.id/%0Aalert(1)",
		"http://shopee.co.id/novoidminds",
		"//shopee.co.id/novoidminds",
		"shopee.co.id/novoidminds",
		"https://shopee.co.id.evil.com/novoidminds",
		"https://evil.com/shopee.co.id",
		"https://evilshopee.co.id/x",
		"https://www.shopee.co.id/novoidminds",
		"https://shopee.com/novoidminds",
		"https://shopee.co.id@evil.com/novoidminds",
		"https://user:pass@shopee.co.id/novoidminds",
		"https://shopee.co.id:8443/novoidminds",
		"https://SHOPEE.CO.ID/novoidminds",
		`https://evil.com\@shopee.co.id/x`,
		`https://shopee.co.id\.evil.com/x`,
		"https://shopee.co.id /x",
		"https://shopee.co.id/x\n",
		"https://shopee.co.id/x\x00",
		"data:text/html,<script>alert(1)</script>",
		"https://shopee.co.id/" + string(make([]byte, 2100)),
	}
	for _, raw := range bad {
		if err := ValidateShopeeURL(raw); err == nil {
			t.Errorf("%q harus ditolak", raw)
		}
	}
}
