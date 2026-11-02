# nvm-company-profile

Website company profile No Void Minds (NVM). Kebutuhan ada di `docs/SRS-NVM-CompanyProfile-v1.1.docx`, rencana kerja di `docs/sprint.md`.

## Jalan di laptop dev

Butuh Go 1.27, Node 24, sqlc, golang-migrate, dan akses SSH ke `nvm-server`.

```bash
# Terminal 1: tunnel ke Postgres, tersedia di 127.0.0.1:15432
./scripts/dev-db-tunnel.sh

# Terminal 2: backend di 127.0.0.1:8082
cd backend
cp .env.example .env   # lalu isi DATABASE_URL dan IP_HASH_SALT
go run ./cmd/server

# Terminal 3: frontend di 127.0.0.1:5175
cd frontend
npm install
npm run dev
```

Pemeriksaan sebelum commit: `./scripts/check.sh`.

## Database

Sekali di awal, sebagai superuser Postgres: jalankan `deploy/sql/00-bootstrap.sql` dengan `psql`.

Migrasi memakai role `compro_migrator`:

```bash
migrate -path backend/migrations -database "$MIGRATOR_URL" up
```

Setelah mengubah `backend/internal/db/queries/` jalankan `sqlc generate` dari folder `backend`.
