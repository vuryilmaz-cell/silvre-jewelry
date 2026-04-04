const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { dbAsync } = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await dbAsync.get(
      'SELECT id, email, full_name, phone, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: { message: 'Profil alınırken hata oluştu' } });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  const { full_name, phone } = req.body;

  try {
    await dbAsync.run(
      'UPDATE users SET full_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [full_name, phone || null, req.user.id]
    );

    // Get updated user
    const user = await dbAsync.get(
      'SELECT id, email, full_name, phone, role FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ 
      message: 'Profil güncellendi',
      user 
    });
  } catch (error) {
    res.status(500).json({ error: { message: 'Profil güncellenirken hata oluştu' } });
  }
});

// Change password
router.put('/password', [
  authenticateToken,
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const userId = req.user.id;
  const { current_password, new_password } = req.body;
  
  try {
    // Get current password hash
    const user = await dbAsync.get(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ error: { message: 'Kullanıcı bulunamadı' } });
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: { message: 'Mevcut şifre hatalı' } });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(new_password, 10);
    
    // Update password
    await dbAsync.run(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, userId]
    );
    
    res.json({ message: 'Şifre başarıyla güncellendi' });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: { message: 'Şifre güncellenirken hata oluştu' } });
  }
});

// Get all users (Admin only)
router.get('/admin/users', [authenticateToken, isAdmin], async (req, res) => {
  try {
    const { limit = 50, offset = 0, role } = req.query;
    
    let whereClause = '';
    const params = [];
    
    if (role) {
      whereClause = 'WHERE role = ?';
      params.push(role);
    }
    
    const users = await dbAsync.all(`
      SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        u.phone, 
        u.role, 
        u.is_active,
        u.created_at,
        (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);
    
    const totalCount = await dbAsync.get(`
      SELECT COUNT(*) as count FROM users ${whereClause}
    `, params);

    res.json({ 
      users,
      pagination: {
        total: totalCount.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: { message: 'Kullanıcılar alınırken hata oluştu' } });
  }
});

module.exports = router;
