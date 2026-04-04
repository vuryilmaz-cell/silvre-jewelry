const express = require('express');
const { dbAsync } = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get product reviews
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await dbAsync.all(`
      SELECT r.*, u.full_name as user_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.is_approved = 1
      ORDER BY r.created_at DESC
    `, [req.params.productId]);

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: { message: 'Yorumlar alınırken hata oluştu' } });
  }
});

// Create review
router.post('/', authenticateToken, async (req, res) => {
  const { product_id, rating, comment } = req.body;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: { message: 'Puan 1-5 arasında olmalıdır' } });
  }

  try {
    // Check if user purchased this product
    const hasPurchased = await dbAsync.get(`
      SELECT o.id FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'
      LIMIT 1
    `, [req.user.id, product_id]);

    if (!hasPurchased) {
      return res.status(403).json({ error: { message: 'Sadece satın aldığınız ürünleri değerlendirebilirsiniz' } });
    }

    await dbAsync.run(
      'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [product_id, req.user.id, rating, comment]
    );

    res.status(201).json({ message: 'Yorumunuz alındı, onay bekliyor' });
  } catch (error) {
    res.status(500).json({ error: { message: 'Yorum eklenirken hata oluştu' } });
  }
});

// Approve review (Admin only)
router.put('/:id/approve', [authenticateToken, isAdmin], async (req, res) => {
  try {
    await dbAsync.run('UPDATE reviews SET is_approved = 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Yorum onaylandı' });
  } catch (error) {
    res.status(500).json({ error: { message: 'Yorum onaylanırken hata oluştu' } });
  }
});

// Delete review (Admin only)
router.delete('/:id', [authenticateToken, isAdmin], async (req, res) => {
  try {
    await dbAsync.run('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ message: 'Yorum silindi' });
  } catch (error) {
    res.status(500).json({ error: { message: 'Yorum silinirken hata oluştu' } });
  }
});

module.exports = router;
