package httpapi

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/db/sqlc"
	"github.com/No-Void-Minds/nvm-company-profile/backend/internal/inquiry"
)

const maxInquiryBody = 64 << 10

func (s *server) createInquiry(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxInquiryBody)

	var input inquiry.Input
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, codeValidation, "Isi formulir tidak bisa dibaca.", nil)
		return
	}

	// Bots should believe they succeeded, so they do not adapt and retry.
	if input.Website != "" {
		code, err := inquiry.NewCode()
		if err != nil {
			s.internalError(c, err)
			return
		}
		c.JSON(http.StatusCreated, gin.H{"code": code})
		return
	}

	key, err := uuid.Parse(c.GetHeader("Idempotency-Key"))
	if err != nil {
		respondError(c, http.StatusBadRequest, codeValidation, "Header Idempotency-Key harus berupa UUID.", nil)
		return
	}

	clean, fields := input.Clean()
	if len(fields) > 0 {
		respondError(c, http.StatusBadRequest, codeValidation, "Periksa lagi isian yang ditandai.", fields)
		return
	}

	// A repeat of a stored submission is checked first and must not use up the quota.
	code, err := s.q.GetInquiryCodeByKey(c, key)
	if err == nil {
		c.JSON(http.StatusCreated, gin.H{"code": code})
		return
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		s.internalError(c, err)
		return
	}

	ipHash := inquiry.HashIP(s.cfg.IPHashSalt, c.ClientIP())
	if !s.inquiryLimit.Allow(ipHash) {
		respondError(c, http.StatusTooManyRequests, codeRateLimited,
			"Terlalu banyak kiriman dari jaringan ini. Coba lagi nanti atau hubungi kami lewat WhatsApp.", nil)
		return
	}

	code, err = s.storeInquiry(c, clean, ipHash, key)
	if err != nil {
		s.internalError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"code": code})
}

func (s *server) storeInquiry(ctx context.Context, in inquiry.Input, ipHash string, key uuid.UUID) (string, error) {
	const uniqueViolation = "23505"

	var lastErr error
	for range 5 {
		code, err := inquiry.NewCode()
		if err != nil {
			return "", err
		}
		stored, err := s.q.CreateInquiry(ctx, sqlc.CreateInquiryParams{
			Code:           code,
			Kind:           in.Kind,
			Name:           in.Name,
			Org:            in.Org,
			City:           in.City,
			Phone:          in.Phone,
			Email:          in.Email,
			Channels:       in.Channels,
			Techs:          in.Techs,
			QuantityNote:   in.QuantityNote,
			Message:        in.Message,
			ConsentAt:      time.Now(),
			IpHash:         ipHash,
			IdempotencyKey: key,
		})
		if err == nil {
			return stored, nil
		}
		// No row back means a concurrent request with the same key won the insert.
		if errors.Is(err, pgx.ErrNoRows) {
			return s.q.GetInquiryCodeByKey(ctx, key)
		}
		var pgErr *pgconn.PgError
		if !errors.As(err, &pgErr) || pgErr.Code != uniqueViolation {
			return "", err
		}
		lastErr = err
	}
	return "", lastErr
}
