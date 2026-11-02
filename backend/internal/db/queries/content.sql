-- name: ListTechs :many
SELECT * FROM techs ORDER BY sort;

-- Falls back to the techs columns, so a tech without a translation still shows (FR-113).
-- name: ListTechsByLang :many
SELECT t.key, t.name, t.family, t.generation, t.needs,
       COALESCE(i.tagline, t.tagline)::text AS tagline,
       COALESCE(i.sub, t.sub)::text AS sub,
       COALESCE(i.description, t.description)::text AS description,
       COALESCE(i.chips, t.chips)::text[] AS chips,
       t.fits, t.technology_label, t.on_rack, t.sort
FROM techs t
LEFT JOIN tech_i18n i ON i.tech_key = t.key AND i.lang = @lang::text
ORDER BY t.sort;

-- name: SetTechOnRack :one
UPDATE techs SET on_rack = @on_rack WHERE key = @key RETURNING *;

-- name: ListCollabs :many
SELECT * FROM collabs ORDER BY sort;

-- name: SetCollabAvailable :one
UPDATE collabs SET available = @available WHERE key = @key RETURNING *;

-- name: GetLabStats :one
SELECT count(*) AS systems, count(*) FILTER (WHERE on_rack) AS on_rack FROM techs;

-- name: ListSizeCharts :many
SELECT * FROM size_charts ORDER BY key;

-- name: GetSizeChart :one
SELECT * FROM size_charts WHERE key = @key;

-- name: UpsertSizeChart :one
INSERT INTO size_charts (key, title, rows, note, updated_at, updated_by)
VALUES (@key, @title, @rows, @note, now(), @updated_by)
ON CONFLICT (key) DO UPDATE
SET title = EXCLUDED.title,
    rows = EXCLUDED.rows,
    note = EXCLUDED.note,
    updated_at = EXCLUDED.updated_at,
    updated_by = EXCLUDED.updated_by
RETURNING *;

-- name: DeleteSizeChart :execrows
DELETE FROM size_charts WHERE key = @key;

-- name: ListVisibleGallery :many
SELECT * FROM gallery_items
WHERE visible AND (sqlc.narg('category')::text IS NULL OR category = sqlc.narg('category'))
ORDER BY sort, created_at DESC;

-- name: ListAllGallery :many
SELECT * FROM gallery_items ORDER BY sort, created_at DESC;

-- name: GetGalleryItem :one
SELECT * FROM gallery_items WHERE id = @id;

-- name: CreateGalleryItem :one
INSERT INTO gallery_items (category, alt, caption, alt_en, caption_en, image_key, width, height, visible, sort)
VALUES (@category, @alt, @caption, @alt_en, @caption_en, @image_key, @width, @height, @visible, @sort)
RETURNING *;

-- name: UpdateGalleryItem :one
UPDATE gallery_items
SET category = @category, alt = @alt, caption = @caption, alt_en = @alt_en, caption_en = @caption_en,
    visible = @visible, sort = @sort
WHERE id = @id
RETURNING *;

-- name: DeleteGalleryItem :one
DELETE FROM gallery_items WHERE id = @id RETURNING image_key;

-- name: ListPublishedTestimonials :many
SELECT * FROM testimonials
WHERE published
  AND (sqlc.narg('source')::text IS NULL OR source = sqlc.narg('source'))
  AND (sqlc.narg('tech')::text IS NULL OR tech_key = sqlc.narg('tech'))
ORDER BY review_date DESC, created_at DESC;

-- name: ListAllTestimonials :many
SELECT * FROM testimonials ORDER BY created_at DESC;

-- name: GetTestimonial :one
SELECT * FROM testimonials WHERE id = @id;

-- name: CreateTestimonial :one
INSERT INTO testimonials (source, review_date, tech_key, rating, transcript, lang, image_key, width, height, blurred_confirmed, published)
VALUES (@source, @review_date, sqlc.narg('tech_key'), sqlc.narg('rating'), @transcript, @lang, @image_key, @width, @height, @blurred_confirmed, @published)
RETURNING *;

-- name: UpdateTestimonial :one
UPDATE testimonials
SET source = @source,
    review_date = @review_date,
    tech_key = sqlc.narg('tech_key'),
    rating = sqlc.narg('rating'),
    transcript = @transcript,
    lang = @lang,
    blurred_confirmed = @blurred_confirmed,
    published = @published
WHERE id = @id
RETURNING *;

-- name: DeleteTestimonial :one
DELETE FROM testimonials WHERE id = @id RETURNING image_key;
