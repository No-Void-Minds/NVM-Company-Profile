-- Revisi v1.2: konten dua bahasa (SRS 14.4). Aman untuk database yang sudah berisi data:
-- tidak ada yang dihapus, kolom baru punya default, dan isi awal tidak menimpa baris yang ada.

-- Teks tech per bahasa (FR-113). Kolom di techs tetap ada sebagai cadangan bila terjemahan
-- belum ada, dan nama tech tidak diterjemahkan.
CREATE TABLE tech_i18n (
  tech_key text NOT NULL REFERENCES techs (key) ON DELETE CASCADE,
  lang text NOT NULL CHECK (lang IN ('id', 'en')),
  tagline text NOT NULL,
  sub text NOT NULL,
  description text NOT NULL,
  chips text[] NOT NULL,
  PRIMARY KEY (tech_key, lang)
);

-- Bahasa Inggris adalah teks asli, disalin dari kolom yang sudah ada.
INSERT INTO tech_i18n (tech_key, lang, tagline, sub, description, chips)
SELECT key, 'en', tagline, sub, description, chips FROM techs
ON CONFLICT DO NOTHING;

-- Isi sama persis dengan internal/db/seed/techs_id.json. JOIN ke techs, agar tech yang
-- sudah dihapus di produksi dilewati dan tidak menggagalkan migrasi.
INSERT INTO tech_i18n (tech_key, lang, tagline, sub, description, chips)
SELECT v.key, 'id', v.tagline, v.sub, v.description, v.chips
FROM (VALUES
  ('aezy', 'Untuk hari-hari yang terasa gerah.', 'Performa, iklim, stretch', 'Kain performa yang ringan. Bernapas, cepat kering, dan lembut seperti udara. Direkayasa untuk bergerak dan menjaga kenyamanan di iklim sehari-hari, dengan pemulihan elastis yang tetap stabil setelah lama dipakai.', ARRAY['Bernapas', 'Cepat kering', 'Lembut seperti udara', 'Pemulihan elastis']::text[]),
  ('aezy-cotton', 'AEZY, dengan sentuhan katun.', 'Sentuhan katun, bernapas, sehari-hari', 'Sistem AEZY dengan sentuhan katun. Rasa katun yang alami dan akrab di kulit, dengan kemampuan bernapas khas AEZY. Dibuat untuk hari yang panjang dan pemakaian sehari-hari.', ARRAY['Rasa katun', 'Bernapas', 'Nyaman sehari-hari']::text[]),
  ('aezy-2', 'AEZY, disempurnakan.', 'Generasi berikutnya, ringan seperti udara, gerak', 'Generasi berikutnya dari sistem AEZY kami. Ringan seperti udara yang sudah kamu kenal, disempurnakan di lab untuk sentuhan yang lebih halus dan gerak yang lebih leluasa sepanjang hari.', ARRAY['Generasi kedua', 'Ringan seperti udara', 'Sentuhan lebih halus']::text[]),
  ('formlock', 'Untuk potongan yang menolak melorot.', 'Struktur, daya tahan bentuk, konstruksi', 'Sistem konstruksi struktural. Panel seam-lock dan rajutan kontur yang padat, direkayasa untuk menjaga siluetnya dari cucian ke cucian, sehingga potongannya tetap setajam hari pertama.', ARRAY['Panel seam-lock', 'Rajutan kontur padat', 'Bentuk terjaga']::text[]),
  ('formlock-2', 'FORMLOCK, dalam lebih banyak potongan.', 'Generasi berikutnya, struktur, siluet', 'Generasi berikutnya dari FORMLOCK. Struktur penahan bentuk yang sama, dikembangkan lebih jauh ke lebih banyak siluet, dari potongan regular yang rapi sampai fit boxy dan oversized yang tetap terjaga bentuknya.', ARRAY['Generasi kedua', 'Menahan bentuk', 'Regular, Boxy, Oversized']::text[]),
  ('curflex', 'Untuk tubuh yang tidak pernah diam.', 'Lekuk, lentur, pemulihan', 'Stretch curve-flex empat arah. Bergerak bersama tubuhmu dan kembali ke bentuknya, untuk mobilitas sepanjang hari tanpa kehilangan struktur. Dibuat untuk menonjolkan bentuk tubuh dan membebaskan gerak.', ARRAY['Stretch empat arah', 'Kembali ke bentuk', 'Mobilitas sepanjang hari']::text[]),
  ('puffmax', 'Untuk saat lembut adalah tujuannya.', 'Loft, empuk, kelembutan', 'Loft dan kepadatan maksimal. Sentuhan tebal dan empuk yang terasa seperti dibungkus awan. Ekstra lembut dan berbobot, dengan kenyamanan yang bertahan dari pemakaian ke pemakaian.', ARRAY['Loft maksimal', 'Sentuhan tebal', 'Nyaman tahan lama']::text[]),
  ('therco', 'Untuk pagi yang dingin dan kantor yang membeku.', 'Termal, nyaman, berlapis', 'Sistem kenyamanan termal untuk jam-jam yang lebih sejuk. Dirancang untuk menjaga hangat tetap dekat dengan tubuh, sambil tetap mudah dilapis dan nyaman dari pagi sampai malam.', ARRAY['Nyaman termal', 'Mudah dilapis', 'Dipakai seharian']::text[]),
  ('antshell', 'Untuk lapisan luar yang lebih rapi.', 'Cangkang, ringan, pelindung sehari-hari', 'Sistem lapisan luar yang terinspirasi dari cangkang ringan. Dibuat agar terasa ringan di badan, sambil memberi pakaian sehari-hari permukaan luar yang rapi dan melindungi.', ARRAY['Cangkang ringan', 'Permukaan luar rapi', 'Lapisan sehari-hari']::text[]),
  ('flexe', 'Untuk rentang gerak penuh.', 'Lentur, mobilitas, leluasa', 'Sistem lentur yang dibuat untuk rentang gerak penuh. Menekuk dan bergerak bersamamu, lalu kembali ke bentuknya, sehingga fit terasa leluasa saat kamu bergerak maupun diam.', ARRAY['Rentang gerak penuh', 'Fit leluasa', 'Kembali ke bentuk']::text[]),
  ('meltwrap', 'Untuk jatuh kain seperti kulit kedua.', 'Jatuh kain, kelembutan, kulit kedua', 'Sistem yang lembut dan cair, jatuh dekat ke tubuh. Halus di kulit dan ringan di tangan, membalut bentuk tubuh dengan lembut untuk rasa nyaman seperti kulit kedua.', ARRAY['Jatuh kain cair', 'Sentuhan halus', 'Rasa kulit kedua']::text[])
) AS v (key, tagline, sub, description, chips)
JOIN techs t ON t.key = v.key
ON CONFLICT DO NOTHING;

-- Galeri: versi Inggris opsional, kosong berarti memakai versi Indonesia (FR-115).
ALTER TABLE gallery_items
  ADD COLUMN alt_en text NOT NULL DEFAULT '',
  ADD COLUMN caption_en text NOT NULL DEFAULT '';

-- Testimoni: transkrip tidak diterjemahkan, hanya dicatat bahasanya (FR-115).
ALTER TABLE testimonials
  ADD COLUMN lang text NOT NULL DEFAULT 'id' CHECK (lang IN ('id', 'en'));
