-- name: GetSetting :one
SELECT * FROM site_settings WHERE key = @key;

-- Upsert, so a deleted row is recreated instead of the change being lost.
-- name: SaveSetting :one
INSERT INTO site_settings (key, value, updated_at, updated_by)
VALUES (@key, @value, now(), @updated_by)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = EXCLUDED.updated_at,
    updated_by = EXCLUDED.updated_by
RETURNING *;
