// Command compro-admin manages admin accounts and runs the inquiry cleanup job.
package main

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"os"
	"regexp"
	"strings"

	"golang.org/x/term"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/auth"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/config"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db/sqlc"
)

const (
	usage             = "pemakaian: compro-admin create-user <username> | reset-password <username> | purge-inquiries"
	minPasswordLength = 10
)

var usernamePattern = regexp.MustCompile(`^[a-z0-9._-]{3,40}$`)

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, "gagal:", err)
		os.Exit(1)
	}
}

func run(args []string) error {
	if len(args) == 0 {
		return errors.New(usage)
	}
	cfg := config.Load()
	if cfg.DatabaseURL == "" {
		return errors.New("DATABASE_URL wajib diisi")
	}
	ctx := context.Background()
	pool, err := db.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()
	q := sqlc.New(pool)

	switch args[0] {
	case "create-user":
		if len(args) != 2 {
			return errors.New(usage)
		}
		return createUser(ctx, q, args[1])
	case "reset-password":
		if len(args) != 2 {
			return errors.New(usage)
		}
		return resetPassword(ctx, q, args[1])
	case "purge-inquiries":
		deleted, err := q.PurgeOldInquiries(ctx)
		if err != nil {
			return err
		}
		fmt.Printf("%d inquiry lebih dari 12 bulan dihapus\n", deleted)
		return nil
	}
	return errors.New(usage)
}

func createUser(ctx context.Context, q *sqlc.Queries, username string) error {
	if !usernamePattern.MatchString(username) {
		return errors.New("username 3 sampai 40 karakter: huruf kecil, angka, titik, garis bawah, tanda hubung")
	}
	hash, err := promptPasswordHash()
	if err != nil {
		return err
	}
	if _, err := q.CreateAdminUser(ctx, sqlc.CreateAdminUserParams{Username: username, PasswordHash: hash}); err != nil {
		return err
	}
	fmt.Println("akun dibuat:", username)
	return nil
}

func resetPassword(ctx context.Context, q *sqlc.Queries, username string) error {
	hash, err := promptPasswordHash()
	if err != nil {
		return err
	}
	affected, err := q.SetAdminPassword(ctx, sqlc.SetAdminPasswordParams{Username: username, PasswordHash: hash})
	if err != nil {
		return err
	}
	if affected == 0 {
		return errors.New("username tidak ditemukan")
	}
	// A password reset usually means the old one leaked, so live sessions end too.
	if err := q.DeleteUserSessions(ctx, username); err != nil {
		return err
	}
	fmt.Println("password diganti:", username)
	return nil
}

func promptPasswordHash() (string, error) {
	password, err := readPassword()
	if err != nil {
		return "", err
	}
	if len(password) < minPasswordLength {
		return "", fmt.Errorf("password minimal %d karakter", minPasswordLength)
	}
	return auth.HashPassword(password)
}

func readPassword() (string, error) {
	fd := int(os.Stdin.Fd())
	if !term.IsTerminal(fd) {
		line, err := bufio.NewReader(os.Stdin).ReadString('\n')
		if err != nil && line == "" {
			return "", errors.New("password kosong")
		}
		return strings.TrimRight(line, "\r\n"), nil
	}

	fmt.Fprint(os.Stderr, "Password: ")
	first, err := term.ReadPassword(fd)
	fmt.Fprintln(os.Stderr)
	if err != nil {
		return "", err
	}
	fmt.Fprint(os.Stderr, "Ulangi password: ")
	second, err := term.ReadPassword(fd)
	fmt.Fprintln(os.Stderr)
	if err != nil {
		return "", err
	}
	if string(first) != string(second) {
		return "", errors.New("password tidak sama")
	}
	return string(first), nil
}
