const express = require('express');
const { dbAsync } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get favorites
router.get('/', authenticateToken, async (req, res) => {
  try {
    const favorites = await dbAsync.all(`
      SELECT p.*, c.name as category_name,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
             f.created_at as favorited_at
      FROM favorites f
      LEFT JOIN products p ON f.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [req.user.id]);

    res.json({ favorites });
  } catch (error) {
    res.status(500).json({ error: { message: 'Favoriler alınırken hata oluştu' } });
  }
});

// Add to favorites
router.post('/:productId', authenticateToken, async (req, res) => {
  try {
    await dbAsync.run(
      'INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)',
      [req.user.id, req.params.productId]
    );

    res.json({ message: 'Favorilere eklendi' });
  } catch (error) {
    res.status(500).json({ error: { message: 'Favorilere eklenirken hata oluştu' } });
  }
});

// Remove from favorites
router.delete('/:productId', authenticateToken, async (req, res) => {
  try {
    await dbAsync.run(
      'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
      [req.user.id, req.params.productId]
    );

    res.json({ message: 'Favorilerden çıkarıldı' });
  } catch (error) {
    res.status(500).json({ error: { message: 'Favorilerden çıkarılırken hata oluştu' } });
  }
});

module.exports = router;
