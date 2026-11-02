-- Dijalankan user sekali sebagai superuser dengan psql, bukan oleh aplikasi:
--   psql -U postgres -f 00-bootstrap.sql
-- Password diminta interaktif agar tidak tertinggal di riwayat shell.
-- Boleh juga diberikan lewat -v migrator_password=... -v app_password=...

\set ON_ERROR_STOP on

\if :{?migrator_password}
\else
  \prompt 'Password compro_migrator: ' migrator_password
\endif
\if :{?app_password}
\else
  \prompt 'Password compro_app: ' app_password
\endif

CREATE ROLE compro_migrator LOGIN PASSWORD :'migrator_password';
CREATE ROLE compro_app LOGIN PASSWORD :'app_password';

CREATE DATABASE nvm_compro OWNER compro_migrator;

-- Container ini dipakai bersama NVM-Internal dan nvm-doomsday, jadi role lain tidak boleh masuk.
REVOKE ALL ON DATABASE nvm_compro FROM PUBLIC;
GRANT CONNECT ON DATABASE nvm_compro TO compro_app;

\connect nvm_compro

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO compro_app;

ALTER DEFAULT PRIVILEGES FOR ROLE compro_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO compro_app;

-- audit_log memakai bigserial, INSERT gagal tanpa hak atas sequence.
ALTER DEFAULT PRIVILEGES FOR ROLE compro_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO compro_app;
