
UPDATE categories
SET image_url = REPLACE(image_url, 'http://localhost:5000http://localhost:5000/', 'http://localhost:5000/')
WHERE image_url LIKE '%http://localhost:5000http://localhost:5000/%';


SELECT * FROM categories

SELECT * FROM products

SELECT * FROM INDEX


UPDATE products 
SET gender = 'erkek' 
WHERE category_id = 4;


SELECT id, name, gender, material, weight FROM products WHERE id IN (9, 10, 11);

ALTER TABLE categories ADD COLUMN gender TEXT DEFAULT 'unisex' CHECK(gender IN ('kadın', 'erkek', 'unisex', 'çocuk'));
ALTER TABLE products ADD COLUMN gender TEXT DEFAULT 'unisex' CHECK(gender IN ('kadın', 'erkek', 'unisex', 'çocuk'));
