-- golang-migrate membuat tabel ini sebelum migrasi pertama, dan default privileges
-- ikut memberi DML ke compro_app. Riwayat migrasi bukan urusan aplikasi.
REVOKE ALL ON TABLE schema_migrations FROM compro_app;

CREATE TABLE techs (
  key text PRIMARY KEY,
  name text NOT NULL,
  family text NOT NULL,
  generation integer NOT NULL,
  needs text[] NOT NULL,
  tagline text NOT NULL,
  sub text NOT NULL,
  description text NOT NULL,
  chips text[] NOT NULL,
  fits text[] NOT NULL,
  technology_label text NOT NULL DEFAULT '',
  on_rack boolean NOT NULL DEFAULT false,
  sort integer NOT NULL
);

CREATE TABLE collabs (
  key text PRIMARY KEY,
  name text NOT NULL,
  available boolean NOT NULL DEFAULT false,
  sort integer NOT NULL
);

CREATE TABLE size_charts (
  key text PRIMARY KEY,
  title text NOT NULL,
  rows text NOT NULL,
  note text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

CREATE TABLE gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  alt text NOT NULL CHECK (length(btrim(alt)) > 0),
  caption text NOT NULL DEFAULT '',
  image_key uuid NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX gallery_items_category_idx ON gallery_items (category);

CREATE TABLE testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('shopee', 'tiktok_shop')),
  review_date date NOT NULL,
  tech_key text REFERENCES techs (key) ON DELETE SET NULL,
  rating smallint CHECK (rating BETWEEN 1 AND 5),
  transcript text NOT NULL CHECK (length(btrim(transcript)) > 0),
  image_key uuid NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  blurred_confirmed boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- BR-02 tetap berlaku walau ada bug di handler.
  CONSTRAINT testimonials_published_blurred CHECK (NOT published OR blurred_confirmed)
);

CREATE INDEX testimonials_published_idx ON testimonials (published);

CREATE TABLE inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('wholesale', 'collaboration')),
  name text NOT NULL,
  org text NOT NULL,
  city text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  channels text NOT NULL DEFAULT '',
  techs text[] NOT NULL DEFAULT '{}',
  quantity_note text NOT NULL DEFAULT '',
  message text NOT NULL,
  consent_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'done', 'spam')),
  ip_hash text NOT NULL,
  idempotency_key uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inquiries_contact_present CHECK (phone <> '' OR email <> '')
);

CREATE INDEX inquiries_status_idx ON inquiries (status);
CREATE INDEX inquiries_created_at_idx ON inquiries (created_at);

CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE sessions (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
  csrf_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES admin_users (id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_at_idx ON audit_log (at);
