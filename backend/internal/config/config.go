// Package config reads runtime settings from the environment.
package config

import (
	"bufio"
	"errors"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	GinMode        string
	HTTPAddr       string
	DatabaseURL    string
	PublicBaseURL  string
	BrandEstYear   int
	MediaDir       string
	IPHashSalt     string
	CookieSecure   bool
	TrustedProxies []string
}

// Load reads .env when present so dev does not need exported variables.
// Real environment variables win over the file.
func Load() Config {
	loadDotEnv(".env")
	return Config{
		GinMode:        env("GIN_MODE", "debug"),
		HTTPAddr:       env("HTTP_ADDR", "127.0.0.1:8082"),
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		PublicBaseURL:  strings.TrimRight(env("PUBLIC_BASE_URL", "http://127.0.0.1:5175"), "/"),
		BrandEstYear:   envInt("BRAND_EST_YEAR", 2021),
		MediaDir:       env("MEDIA_DIR", "var/media"),
		IPHashSalt:     os.Getenv("IP_HASH_SALT"),
		CookieSecure:   os.Getenv("COOKIE_SECURE") == "true",
		TrustedProxies: splitList(os.Getenv("TRUSTED_PROXIES")),
	}
}

// ValidateServer lists what only the HTTP server needs, the CLI skips the salt.
func (c Config) ValidateServer() error {
	if c.DatabaseURL == "" {
		return errors.New("DATABASE_URL wajib diisi")
	}
	if c.IPHashSalt == "" {
		return errors.New("IP_HASH_SALT wajib diisi")
	}
	return nil
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envInt(key string, fallback int) int {
	n, err := strconv.Atoi(os.Getenv(key))
	if err != nil {
		return fallback
	}
	return n
}

func splitList(raw string) []string {
	var out []string
	for _, part := range strings.Split(raw, ",") {
		if part = strings.TrimSpace(part); part != "" {
			out = append(out, part)
		}
	}
	return out
}

func loadDotEnv(path string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()

	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		if _, exists := os.LookupEnv(key); !exists {
			_ = os.Setenv(key, strings.Trim(strings.TrimSpace(value), `"'`))
		}
	}
}
