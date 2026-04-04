const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { dbAsync } = require('../config/database');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await dbAsync.all(
      'SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC, name ASC'
    );
    
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: { message: 'Kategoriler alınırken hata oluştu' } });
  }
});

// Get category by slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  
  try {
    const category = await dbAsync.get(
      'SELECT * FROM categories WHERE slug = ? AND is_active = 1',
      [slug]
    );
    
    if (!category) {
      return res.status(404).json({ error: { message: 'Kategori bulunamadı' } });
    }
    
    // Get products in this category
    const products = await dbAsync.all(
      `SELECT p.*, 
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
       FROM products p
       WHERE p.category_id = ? AND p.is_active = 1
       ORDER BY p.created_at DESC`,
      [category.id]
    );
    
    res.json({ 
      category,
      products 
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: { message: 'Kategori alınırken hata oluştu' } });
  }
});

// Create category (Admin only)
router.post('/', [authenticateToken, isAdmin, upload.single('image')], async (req, res) => {
  const { name, slug, description, display_order = 0, is_active = 1 } = req.body;
  
  if (!name || !slug) {
    return res.status(400).json({ error: { message: 'Kategori adı ve slug gerekli' } });
  }
  
  try {
    // Check if slug already exists
    const existing = await dbAsync.get('SELECT id FROM categories WHERE slug = ?', [slug]);
    
    if (existing) {
      return res.status(400).json({ error: { message: 'Bu slug zaten kullanılıyor' } });
    }
    
    const imageUrl = req.file 
    ? `${process.env.API_URL || 'http://localhost:5000'}/uploads/products/${req.file.filename}` 
    : null;
        
    const result = await dbAsync.run(
      'INSERT INTO categories (name, slug, description, image_url, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [name, slug, description, imageUrl, display_order, is_active]
    );
    
    res.status(201).json({ 
      message: 'Kategori oluşturuldu',
      categoryId: result.lastID 
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: { message: 'Kategori oluşturulurken hata oluştu' } });
  }
});

// Update category (Admin only)
router.put('/:id', [authenticateToken, isAdmin, upload.single('image')], async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, display_order, is_active } = req.body;
  
  try {
    // Check if category exists
    const category = await dbAsync.get('SELECT id, image_url FROM categories WHERE id = ?', [id]);
    
    if (!category) {
      return res.status(404).json({ error: { message: 'Kategori bulunamadı' } });
    }
    
    // Check if slug is already used by another category
    const existing = await dbAsync.get(
      'SELECT id FROM categories WHERE slug = ? AND id != ?',
      [slug, id]
    );
    
    if (existing) {
      return res.status(400).json({ error: { message: 'Bu slug başka bir kategori tarafından kullanılıyor' } });
    }
    
    // Determine image URL
    let imageUrl = category.image_url; // Keep existing image by default
    if (req.file) {
      // New image uploaded
      imageUrl = `${process.env.API_URL || 'http://localhost:5000'}/uploads/products/${req.file.filename}`;
      
      // TODO: Delete old image file if exists
      // const fs = require('fs');
      // const path = require('path');
      // if (category.image_url) {
      //   const oldPath = path.join(__dirname, '..', category.image_url);
      //   if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      // }
    }
    
    await dbAsync.run(
      'UPDATE categories SET name = ?, slug = ?, description = ?, image_url = ?, display_order = ?, is_active = ? WHERE id = ?',
      [name, slug, description, imageUrl, display_order, is_active, id]
    );
    
    res.json({ message: 'Kategori güncellendi' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: { message: 'Kategori güncellenirken hata oluştu' } });
  }
});

// Delete category (Admin only)
router.delete('/:id', [authenticateToken, isAdmin], async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if category exists
    const category = await dbAsync.get('SELECT id FROM categories WHERE id = ?', [id]);
    
    if (!category) {
      return res.status(404).json({ error: { message: 'Kategori bulunamadı' } });
    }
    
    // Check if category has products
    const products = await dbAsync.get(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );
    
    if (products.count > 0) {
      return res.status(400).json({ 
        error: { message: `Bu kategoriye ait ${products.count} ürün var. Önce ürünleri silmeniz gerekiyor.` } 
      });
    }
    
    await dbAsync.run('DELETE FROM categories WHERE id = ?', [id]);
    
    res.json({ message: 'Kategori silindi' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: { message: 'Kategori silinirken hata oluştu' } });
  }
});

module.exports = router;
