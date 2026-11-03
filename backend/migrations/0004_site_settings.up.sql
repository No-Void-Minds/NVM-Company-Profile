-- Pengaturan situs yang diubah admin, mulai dari halaman password (FR-120). Aman untuk
-- database yang sudah berisi data: hanya menambah tabel, dan baris awal tidak menimpa yang ada.
CREATE TABLE site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

-- Default aktif: situs terkunci sampai admin membukanya.
INSERT INTO site_settings (key, value) VALUES ('password_gate', '{"enabled": true}')
ON CONFLICT DO NOTHING;
