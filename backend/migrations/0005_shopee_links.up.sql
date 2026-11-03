-- Revisi Sprint 19: tujuan beli pindah ke Shopee (FR-130 dan seterusnya). Aman untuk database
-- yang sudah berisi data: hanya menambah tabel dan kolom, tidak menghapus apa pun, dan
-- tidak menyentuh on_rack. Satu-satunya UPDATE menyembunyikan MELTWRAP (FR-134).

-- Link produk Shopee per tech dan fit. fit NULL adalah link level tech untuk tech tanpa fit.
CREATE TABLE tech_links (
  tech_key text NOT NULL REFERENCES techs (key) ON DELETE CASCADE,
  fit text,
  url text NOT NULL CHECK (url ~ '^https://shopee\.co\.id([/?#]|$)'),
  sort integer NOT NULL DEFAULT 0,
  UNIQUE NULLS NOT DISTINCT (tech_key, fit)
);

-- Link koleksi Shopee per collab, diisi admin. Kosong berarti tampil sebagai teks biasa.
ALTER TABLE collabs ADD COLUMN url text CHECK (url IS NULL OR url ~ '^https://shopee\.co\.id([/?#]|$)');

-- Tech yang disembunyikan tidak tampil di situs dan tidak ikut dihitung di Lab index.
ALTER TABLE techs ADD COLUMN visible boolean NOT NULL DEFAULT true;
UPDATE techs SET visible = false WHERE key = 'meltwrap';

-- Isi sama persis dengan internal/db/seed/tech_links.json. Tech yang sudah dihapus dan fit
-- yang tidak ada lagi di techs.fits dilewati, link yang sudah diisi admin tidak ditimpa.
INSERT INTO tech_links (tech_key, fit, url, sort)
SELECT v.tech_key, v.fit, v.url, v.sort
FROM (VALUES
  ('aezy', 'Regular', 'https://shopee.co.id/No-Void-Minds-AEZY-Regular-T-Shirt-Core-i.462123491.25438116155', 1),
  ('aezy', 'Polo', 'https://shopee.co.id/No-Void-Minds-AEZY-Polo-Shirt-Core-i.462123491.41081865803', 3),
  ('aezy-cotton', 'Regular', 'https://shopee.co.id/No-Void-Minds-AEZY-Cotton-Regular-T-Shirt-Core-i.462123491.41673060029', 1),
  ('aezy-cotton', 'Polo', 'https://shopee.co.id/No-Void-Minds-AEZY-Cotton-Polo-Shirt-Core-i.462123491.50012937499', 2),
  ('aezy-2', 'Regular', 'https://shopee.co.id/No-Void-Minds-AEZY-2-Regular-T-Shirt-Core-i.462123491.45065468242', 1),
  ('aezy-2', 'Fitted', 'https://shopee.co.id/No-Void-Minds-AEZY-2-Fitted-T-Shirt-Core-i.462123491.52665460920', 2),
  ('formlock', 'Oversized', 'https://shopee.co.id/No-Void-Minds-FORMLOCK-Oversized-T-Shirt-Core-i.462123491.25518296413', 1),
  ('formlock', 'Regular', 'https://shopee.co.id/No-Void-Minds-FORMLOCK-Regular-T-Shirt-Core-i.462123491.45153460488', 2),
  ('formlock', 'Boxy', 'https://shopee.co.id/No-Void-Minds-FORMLOCK-Boxy-T-Shirt-Core-i.462123491.27330401244', 3),
  ('formlock', 'Fitted', 'https://shopee.co.id/No-Void-Minds-FORMLOCK-Fitted-T-Shirt-Core-i.462123491.52053546708', 4),
  ('formlock-2', 'Oversized', 'https://shopee.co.id/No-Void-Minds-FORMLOCK-2-Oversized-T-Shirt-Charcoal-i.462123491.51715329550', 3),
  ('formlock-2', 'Regular', 'https://shopee.co.id/No-Void-Minds-FORMLOCK-2-Regular-T-Shirt-Core-i.462123491.57415356630', 1),
  ('formlock-2', 'Boxy', 'https://shopee.co.id/No-Void-Minds-FORMLOCK-2-Boxy-Fit-T-Shirt-Core-i.462123491.47515372133', 2),
  ('curflex', 'Regular', 'https://shopee.co.id/No-Void-Minds-Curflex-Regular-Women-T-Shirt-Core-i.462123491.53811296809', 1),
  ('curflex', 'Fitted', 'https://shopee.co.id/No-Void-Minds-Curflex-Fitted-Women-T-Shirt-Core-i.462123491.53861288110', 2),
  ('curflex', 'Mini Fitted', 'https://shopee.co.id/No-Void-Minds-Curflex-Mini-Fitted-Crop-Women-T-Shirt-Core-i.462123491.51761294268', 3),
  ('puffmax', 'Oversized', 'https://shopee.co.id/No-Void-Minds-PUFFMAX-Oversized-T-Shirt-Core-i.462123491.46265367990', 1),
  ('puffmax', 'Regular', 'https://shopee.co.id/No-Void-Minds-PUFFMAX-Regular-T-Shirt-Core-i.462123491.57865356127', 2),
  ('therco', NULL, 'https://shopee.co.id/No-Void-Minds-Therco-Pullover-Hoodie-Agave-i.462123491.46863037318', 1),
  ('antshell', NULL, 'https://shopee.co.id/No-Void-Minds-ANTSHELL-Windbreaker-Jacket-Oatmeal-i.462123491.56101786459', 1),
  ('flexe', NULL, 'https://shopee.co.id/No-Void-Minds-FLEXE-Regular-Fit-Jeans-Ocean-i.462123491.50053920188', 1)
) AS v (tech_key, fit, url, sort)
JOIN techs t ON t.key = v.tech_key AND (v.fit IS NULL OR v.fit = ANY (t.fits))
ON CONFLICT DO NOTHING;
