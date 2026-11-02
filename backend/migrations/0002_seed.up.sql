-- Isi sama persis dengan internal/db/seed/*.json.

INSERT INTO techs (key, name, family, generation, needs, tagline, sub, description, chips, fits, technology_label, on_rack, sort) VALUES
  ('aezy', 'AEZY', 'AEZY', 1, ARRAY['hot']::text[], 'For days that run hot.', 'Performance, climate, stretch', 'Lightweight performance fabric. Breathable, fast-drying and air-feel soft. Engineered for movement and everyday climate control, with elastic recovery that stays stable after long wear.', ARRAY['Breathable', 'Fast-drying', 'Air-feel soft', 'Elastic recovery']::text[], ARRAY['Regular', 'Fitted', 'Polo']::text[], 'Air feel technology', false, 1),
  ('aezy-cotton', 'AEZY COTTON', 'AEZY', 1, ARRAY['hot', 'soft']::text[], 'AEZY, with a cotton hand.', 'Cotton touch, breathable, everyday', 'The AEZY system with a cotton touch. The natural, familiar feel of cotton on the skin, with the easy breathability AEZY is known for. Made for long days and everyday wear.', ARRAY['Cotton hand-feel', 'Breathable', 'Everyday comfort']::text[], ARRAY['Regular', 'Polo']::text[], '', false, 2),
  ('aezy-2', 'AEZY 2', 'AEZY', 2, ARRAY['hot', 'move']::text[], 'AEZY, refined.', 'Next generation, air-feel, movement', 'The next generation of our AEZY system. The same air-feel lightness you know, refined in the lab for a smoother hand and easier movement through the day.', ARRAY['Second generation', 'Air-feel light', 'Refined hand']::text[], ARRAY['Regular', 'Fitted']::text[], '', false, 3),
  ('formlock', 'FORMLOCK', 'FORMLOCK', 1, ARRAY['shape']::text[], 'For cuts that refuse to sag.', 'Structure, hold, construction', 'A structural construction system. Seam-lock paneling and dense contour knits engineered to hold their silhouette wash after wash, so the cut stays as sharp as day one.', ARRAY['Seam-lock paneling', 'Dense contour knit', 'Holds its shape']::text[], ARRAY['Oversized', 'Regular', 'Boxy', 'Fitted']::text[], 'Contour conditioning technology', false, 4),
  ('formlock-2', 'FORMLOCK 2', 'FORMLOCK', 2, ARRAY['shape']::text[], 'FORMLOCK, in more cuts.', 'Next generation, structure, silhouette', 'The next generation of FORMLOCK. The same shape-holding structure, developed further across more silhouettes, from clean regular cuts to boxy and oversized fits that keep their form.', ARRAY['Second generation', 'Shape-holding', 'Regular, Boxy, Oversized']::text[], ARRAY['Regular', 'Boxy', 'Oversized']::text[], '', false, 5),
  ('curflex', 'CURFLEX', 'CURFLEX', 1, ARRAY['move']::text[], 'For bodies that never sit still.', 'Curve, flex, recovery', 'Four-way curve-flex stretch. Moves with your body and recovers its shape for all-day mobility without losing structure. Built to flatter the figure and free the movement.', ARRAY['Four-way stretch', 'Shape recovery', 'All-day mobility']::text[], ARRAY['Regular', 'Fitted', 'Mini Fitted']::text[], 'Smooth flex technology', false, 6),
  ('puffmax', 'PUFFMAX', 'PUFFMAX', 1, ARRAY['soft']::text[], 'For when soft is the whole point.', 'Loft, cushion, softness', 'Maximum loft and density. A plush, cushioned hand that feels like being wrapped in a cloud. Extra-soft and substantial, with comfort that holds up wear after wear.', ARRAY['Maximum loft', 'Plush hand', 'Lasting comfort']::text[], ARRAY['Oversized', 'Regular']::text[], '', false, 7),
  ('therco', 'THERCO', 'THERCO', 1, ARRAY['cold']::text[], 'For cold mornings and freezing offices.', 'Thermal, comfort, layering', 'A thermal comfort system built for cooler hours. Designed to keep warmth close to the body while staying easy to layer and comfortable from morning to night.', ARRAY['Thermal comfort', 'Easy layering', 'All-day wear']::text[], '{}'::text[], '', false, 8),
  ('antshell', 'ANTSHELL', 'ANTSHELL', 1, ARRAY['layer']::text[], 'For a cleaner outer layer.', 'Shell, light, everyday armor', 'An outer-layer system inspired by a lightweight shell. Built to feel light on the body while giving everyday pieces a clean, protective outer face.', ARRAY['Lightweight shell', 'Clean outer face', 'Everyday layer']::text[], '{}'::text[], '', false, 9),
  ('flexe', 'FLEXE', 'FLEXE', 1, ARRAY['move']::text[], 'For a full range of motion.', 'Flex, mobility, ease', 'A flexible system made for full range of motion. Bends and moves with you, then settles back into shape, so the fit feels easy whether you are moving or standing still.', ARRAY['Full range of motion', 'Easy fit', 'Settles back into shape']::text[], '{}'::text[], '', false, 10),
  ('meltwrap', 'MELTWRAP', 'MELTWRAP', 1, ARRAY['soft']::text[], 'For a second-skin drape.', 'Drape, softness, second skin', 'A soft, fluid system that drapes close to the body. Smooth against the skin and light in the hand, it wraps the figure gently for an easy, second-skin feel.', ARRAY['Fluid drape', 'Smooth hand', 'Second-skin feel']::text[], '{}'::text[], '', false, 11);

INSERT INTO collabs (key, name, available, sort) VALUES
  ('marvel', 'Marvel', true, 1),
  ('toy-story', 'Toy Story', true, 2),
  ('star-wars', 'Star Wars', true, 3),
  ('mickey-mouse', 'Mickey Mouse', true, 4),
  ('donald-duck', 'Donald Duck', true, 5),
  ('inside-out', 'Inside Out', true, 6),
  ('the-incredibles', 'The Incredibles', true, 7),
  ('villains', 'Villains', true, 8),
  ('moana', 'Moana', false, 9),
  ('zootopia', 'Zootopia', true, 10);

INSERT INTO size_charts (key, title, rows, note) VALUES
  ('aezy-regular', 'AEZY Regular T-Shirt', E'Size / Ukuran | Width / Lebar Badan | Length / Panjang Badan | Sleeve / Panjang Lengan | Height* / Tinggi Badan
S | 48 | 66 | 21 | < 160
M | 51 | 68.5 | 22 | 160-170
L | 54 | 71 | 23 | 170-180
XL | 57 | 73.5 | 24 | 180-190
XXL | 60 | 76 | 25 | > 190', E'All measurements in cm. Tolerance 1-2 cm.
*Height is a recommendation only. Compare with the measurements above for your best fit.');
