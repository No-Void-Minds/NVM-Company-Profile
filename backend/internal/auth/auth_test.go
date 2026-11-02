package auth

import (
	"strings"
	"testing"
)

func TestHashAndVerifyPassword(t *testing.T) {
	hash, err := HashPassword("password-uji-panjang")
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(hash, "$argon2id$v=19$m=65536,t=3,p=2$") {
		t.Fatalf("parameter argon2id salah: %s", hash)
	}
	if strings.Contains(hash, "password-uji-panjang") {
		t.Fatal("hash memuat password")
	}

	ok, err := VerifyPassword("password-uji-panjang", hash)
	if err != nil || !ok {
		t.Fatalf("password benar ditolak: %v", err)
	}
	ok, err = VerifyPassword("password-salah", hash)
	if err != nil || ok {
		t.Fatalf("password salah diterima: %v", err)
	}
}

func TestHashUsesRandomSalt(t *testing.T) {
	a, _ := HashPassword("sama")
	b, _ := HashPassword("sama")
	if a == b {
		t.Fatal("salt harus acak")
	}
}

func TestVerifyRejectsMalformedHash(t *testing.T) {
	for _, bad := range []string{"", "bukan-hash", "$bcrypt$x$y$z$w", "$argon2id$v=19$m=x$a$b"} {
		if _, err := VerifyPassword("x", bad); err == nil {
			t.Fatalf("hash rusak %q seharusnya error", bad)
		}
	}
}

func TestNewTokenLengthAndUniqueness(t *testing.T) {
	a, err := NewToken()
	if err != nil {
		t.Fatal(err)
	}
	b, _ := NewToken()
	// 32 bytes in unpadded base64url
	if len(a) != 43 || a == b {
		t.Fatalf("token salah: %q %q", a, b)
	}
}

func TestHashTokenIsStableAndOneWay(t *testing.T) {
	if HashToken("t") != HashToken("t") || HashToken("t") == HashToken("u") {
		t.Fatal("hash token harus stabil dan berbeda per token")
	}
	if len(HashToken("t")) != 64 || HashToken("t") == "t" {
		t.Fatal("hash token harus SHA-256 hex")
	}
}

func TestTokensEqual(t *testing.T) {
	if !TokensEqual("abc", "abc") || TokensEqual("abc", "abd") || TokensEqual("abc", "") {
		t.Fatal("perbandingan token salah")
	}
}
