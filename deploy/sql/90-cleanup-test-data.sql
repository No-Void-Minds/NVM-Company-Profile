-- Menghapus data hasil Sprint 10. Dijalankan user sebagai compro_app, sekali, setelah pengujian:
--   psql "$DATABASE_URL" -f deploy/sql/90-cleanup-test-data.sql
--
-- Awalan dicocokkan sebagai 'UJI ' dengan spasi, sehingga nama asli seperti "UJIAN" tidak ikut.
-- Audit log dihapus lebih dulu, karena menghapus akun hanya mengosongkan user_id-nya.
-- Akun rifky dan aktivitasnya tidak disentuh.
--
-- File media hasil uji, dijalankan dari root repo setelah skrip ini:
--   Git Bash:   rm -f backend/var/media/*.webp
--   PowerShell: Remove-Item backend\var\media\*.webp
-- Saat Sprint 10 selesai folder itu sudah kosong. Lewati perintah ini bila sesudahnya sudah
-- ada foto asli yang diunggah lewat backend dev, karena perintahnya menghapus semua file di sana.

\set ON_ERROR_STOP on

BEGIN;

DELETE FROM inquiries WHERE name LIKE 'UJI %';
DELETE FROM gallery_items WHERE alt LIKE 'UJI %' OR caption LIKE 'UJI %';
DELETE FROM testimonials WHERE transcript LIKE 'UJI %';

DELETE FROM sessions WHERE user_id IN (SELECT id FROM admin_users WHERE username = 'uji-admin');
DELETE FROM audit_log WHERE user_id IN (SELECT id FROM admin_users WHERE username = 'uji-admin');
DELETE FROM admin_users WHERE username = 'uji-admin';

COMMIT;

-- Semua angka di bawah harus 0.
SELECT
  (SELECT count(*) FROM inquiries WHERE name LIKE 'UJI %') AS inquiry_uji,
  (SELECT count(*) FROM gallery_items WHERE alt LIKE 'UJI %' OR caption LIKE 'UJI %') AS galeri_uji,
  (SELECT count(*) FROM testimonials WHERE transcript LIKE 'UJI %') AS testimoni_uji,
  (SELECT count(*) FROM admin_users WHERE username = 'uji-admin') AS akun_uji,
  (SELECT count(*) FROM techs WHERE on_rack) AS tech_on_rack,
  (SELECT count(*) FROM collabs WHERE key = 'moana' AND available) AS moana_available;
