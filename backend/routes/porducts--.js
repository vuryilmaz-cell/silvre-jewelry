const express = require('express');
const { body, validationResult } = require('express-validator');
const { dbAsync } = require('../config/database');
const { authenticateToken, isAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Helper: Generate slug from Turkish text
function generateSlug(text) {
  const trMap = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u'
  };
  
  return text
    .split('')
    .map(char => trMap[char] || char)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Get all products (with filters)
router.get('/', optionalAuth, async (req, res) => {
  const { category, featured, search, sort = 'created_at', order = 'DESC', limit = 20, offset = 0 } = req.query;

  try {
    let query = `
      SELECT p.*, c.name as category_name,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];
    
    // ✅ Admin tüm ürünleri görebilir, public kullanıcılar sadece aktif ürünleri
    const isAdminUser = req.user && req.user.role === 'admin';
    if (!isAdminUser) {
      query += ' AND p.is_active = 1';
    }

    // Filters
    if (category) {
      query += ' AND c.slug = ?';
      params.push(category);
    }

    if (featured === 'true') {
      query += ' AND p.is_featured = 1';
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sorting
    const allowedSorts = ['created_at', 'price', 'name', 'views'];
    const sortField = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY p.${sortField} ${sortOrder}`;

    // Pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const products = await dbAsync.all(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
    const countParams = [];
    
    // ✅ Admin tüm ürünleri sayar, public sadece aktif olanları
    if (!isAdminUser) {
      countQuery += ' AND p.is_active = 1';
    }
    
    if (category) {
      countQuery += ' AND c.slug = ?';
      countParams.push(category);
    }
    if (featured === 'true') {
      countQuery += ' AND p.is_featured = 1';
    }
    if (search) {
      countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const { total } = await dbAsync.get(countQuery, countParams);

    res.json({
      products,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + products.length) < total
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: { message: 'Ürünler alınırken hata oluştu' } });
  }
});

// Get single product
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    // ✅ Admin tüm ürünleri görebilir, public sadece aktif olanları
    const isAdminUser = req.user && req.user.role === 'admin';
    const activeCondition = isAdminUser ? '' : 'AND p.is_active = 1';
    
    const product = await dbAsync.get(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? ${activeCondition}
    `, [req.params.id]);

    if (!product) {
      return res.status(404).json({ error: { message: 'Ürün bulunamadı' } });
    }

    // Get product images
    const images = await dbAsync.all(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, display_order',
      [req.params.id]
    );

    // Get reviews
    const reviews = await dbAsync.all(`
      SELECT r.*, u.full_name as user_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.is_approved = 1
      ORDER BY r.created_at DESC
    `, [req.params.id]);

    // Calculate average rating
    const ratingData = await dbAsync.get(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE product_id = ? AND is_approved = 1',
      [req.params.id]
    );

    // Increment view count
    await dbAsync.run('UPDATE products SET views = views + 1 WHERE id = ?', [req.params.id]);

    // Check if favorited by user
    let isFavorite = false;
    if (req.user) {
      const favorite = await dbAsync.get(
        'SELECT id FROM favorites WHERE user_id = ? AND product_id = ?',
        [req.user.id, req.params.id]
      );
      isFavorite = !!favorite;
    }

    res.json({
      ...product,
      images,
      reviews,
      avg_rating: ratingData.avg_rating || 0,
      review_count: ratingData.review_count || 0,
      is_favorite: isFavorite
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: { message: 'Ürün alınırken hata oluştu' } });
  }
});

// Create product (Admin only)
router.post('/', [authenticateToken, isAdmin], async (req, res) => {
  let {
    category_id, name, slug, description, price, discount_price,
    stock_quantity, sku, material, weight, is_featured
  } = req.body;

  try {
    // Auto-generate slug if not provided
    if (!slug) {
      slug = generateSlug(name);
      
      // Ensure slug is unique
      const existing = await dbAsync.get('SELECT id FROM products WHERE slug = ?', [slug]);
      if (existing) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const result = await dbAsync.run(`
      INSERT INTO products (
        category_id, name, slug, description, price, discount_price,
        stock_quantity, sku, material, weight, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      category_id, name, slug, description || '', price, discount_price || null,
      stock_quantity || 0, sku || null, material || '925 Ayar Gümüş',
      weight || null, is_featured ? 1 : 0
    ]);

    res.status(201).json({
      message: 'Ürün başarıyla eklendi',
      productId: result.lastID,
      slug
    });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.message.includes('UNIQUE')) {
      res.status(400).json({ error: { message: 'Bu slug veya SKU zaten kullanılıyor' } });
    } else {
      res.status(500).json({ error: { message: 'Ürün eklenirken hata oluştu' } });
    }
  }
});

// Update product (Admin only)
router.put('/:id', [authenticateToken, isAdmin], async (req, res) => {
  let {
    category_id, name, slug, description, price, discount_price,
    stock_quantity, sku, material, weight, is_featured, is_active
  } = req.body;

  try {
    // Auto-generate slug if not provided
    if (!slug) {
      slug = generateSlug(name);
    }

    await dbAsync.run(`
      UPDATE products SET
        category_id = ?, name = ?, slug = ?, description = ?,
        price = ?, discount_price = ?, stock_quantity = ?,
        sku = ?, material = ?, weight = ?, is_featured = ?,
        is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      category_id, name, slug, description || '', price, discount_price || null,
      stock_quantity, sku || null, material, weight || null,
      is_featured ? 1 : 0, is_active ? 1 : 0, req.params.id
    ]);

    res.json({ message: 'Ürün başarıyla güncellendi' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: { message: 'Ürün güncellenirken hata oluştu' } });
  }
});

// Delete product (Admin only)
router.delete('/:id', [authenticateToken, isAdmin], async (req, res) => {
  try {
    await dbAsync.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Ürün başarıyla silindi' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: { message: 'Ürün silinirken hata oluştu' } });
  }
});

module.exports = router;