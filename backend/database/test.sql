
UPDATE categories
SET image_url = REPLACE(image_url, 'http://localhost:5000http://localhost:5000/', 'http://localhost:5000/')
WHERE image_url LIKE '%http://localhost:5000http://localhost:5000/%';


SELECT * FROM categories