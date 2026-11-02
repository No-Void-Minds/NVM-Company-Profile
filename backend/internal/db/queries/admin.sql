-- name: CreateAdminUser :one
INSERT INTO admin_users (username, password_hash) VALUES (@username, @password_hash) RETURNING id;

-- name: GetAdminUserByUsername :one
SELECT * FROM admin_users WHERE username = @username;

-- name: SetAdminPassword :execrows
UPDATE admin_users SET password_hash = @password_hash WHERE username = @username;

-- name: TouchAdminLogin :exec
UPDATE admin_users SET last_login_at = now() WHERE id = @id;

-- name: CreateSession :exec
INSERT INTO sessions (id, user_id, csrf_token, expires_at) VALUES (@id, @user_id, @csrf_token, @expires_at);

-- name: GetActiveSession :one
SELECT s.id, s.user_id, s.csrf_token, s.last_seen_at, u.username
FROM sessions s
JOIN admin_users u ON u.id = s.user_id
WHERE s.id = @id AND s.expires_at > now();

-- name: TouchSession :exec
UPDATE sessions SET last_seen_at = now(), expires_at = @expires_at WHERE id = @id;

-- name: DeleteSession :exec
DELETE FROM sessions WHERE id = @id;

-- name: DeleteExpiredSessions :exec
DELETE FROM sessions WHERE expires_at <= now();

-- name: DeleteUserSessions :exec
DELETE FROM sessions WHERE user_id = (SELECT id FROM admin_users WHERE username = @username);

-- name: CreateAuditLog :exec
INSERT INTO audit_log (user_id, action, entity, entity_id) VALUES (@user_id, @action, @entity, @entity_id);

-- name: ListAuditLog :many
SELECT a.id, a.action, a.entity, a.entity_id, a.at, u.username
FROM audit_log a
LEFT JOIN admin_users u ON u.id = a.user_id
ORDER BY a.at DESC, a.id DESC
LIMIT 200;
