// backend/routes/sitemap.js
const express = require('express');
const { dbAsync } = require('../config/database');

const router = express.Router();

// Dinamik Sitemap Generator
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://silvre.com';
    const today = new Date().toISOString().split('T')[0];
    
    // Kategorileri al
    const categories = await dbAsync.all(
      'SELECT slug, created_at FROM categories WHERE is_active = 1'
    );
    
    // Ürünleri al
    const products = await dbAsync.all(`
      SELECT slug, updated_at, 
             (SELECT image_url FROM product_images WHERE product_id = products.id AND is_primary = 1 LIMIT 1) as image
      FROM products 
      WHERE is_active = 1
    `);
    
    // XML oluştur
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Ana Sayfa -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Ürünler -->
  <url>
    <loc>${baseUrl}/products.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- Kategoriler -->
  <url>
    <loc>${baseUrl}/categories.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;

    // Kategori URL'leri ekle
    categories.forEach(cat => {
      const lastmod = cat.created_at ? cat.created_at.split(' ')[0] : today;
      xml += `
  <url>
    <loc>${baseUrl}/categories.html?category=${cat.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });
    
    // Ürün URL'leri ekle
    products.forEach(product => {
      const lastmod = product.updated_at ? product.updated_at.split(' ')[0] : today;
      xml += `
  <url>
    <loc>${baseUrl}/product.html?id=${product.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>`;
      
      if (product.image) {
        xml += `
    <image:image>
      <image:loc>${product.image.startsWith('http') ? product.image : baseUrl + product.image}</image:loc>
    </image:image>`;
      }
      
      xml += `
  </url>`;
    });
    
    // Statik sayfalar
    const staticPages = [
      { url: '/about.html', priority: '0.6' },
      { url: '/contact.html', priority: '0.6' },
      { url: '/faq.html', priority: '0.5' },
      { url: '/shipping.html', priority: '0.5' },
      { url: '/returns.html', priority: '0.5' }
    ];
    
    staticPages.forEach(page => {
      xml += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });
    
    xml += `
</urlset>`;
    
    // XML olarak döndür
    res.header('Content-Type', 'application/xml');
    res.send(xml);
    
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Sitemap generation failed');
  }
});

module.exports = router;
