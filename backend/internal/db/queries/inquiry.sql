-- name: CreateInquiry :one
INSERT INTO inquiries (code, kind, name, org, city, phone, email, channels, techs, quantity_note, message, consent_at, ip_hash, idempotency_key)
VALUES (@code, @kind, @name, @org, @city, @phone, @email, @channels, @techs, @quantity_note, @message, @consent_at, @ip_hash, @idempotency_key)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING code;

-- name: GetInquiryCodeByKey :one
SELECT code FROM inquiries WHERE idempotency_key = @idempotency_key;

-- name: ListInquiries :many
SELECT * FROM inquiries
WHERE (sqlc.narg('kind')::text IS NULL OR kind = sqlc.narg('kind'))
  AND (sqlc.narg('status')::text IS NULL OR status = sqlc.narg('status'))
ORDER BY created_at DESC;

-- name: GetInquiry :one
SELECT * FROM inquiries WHERE id = @id;

-- name: SetInquiryStatus :one
UPDATE inquiries SET status = @status WHERE id = @id RETURNING *;

-- name: PurgeOldInquiries :execrows
DELETE FROM inquiries WHERE created_at < now() - interval '12 months';
