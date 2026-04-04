const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { dbAsync } = require('../config/database');

const router = express.Router();

// Get user's addresses
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const addresses = await dbAsync.all(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    
    res.json({ addresses });
    
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: { message: 'Adresler alınırken hata oluştu' } });
  }
});

// Get single address
router.get('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  try {
    const address = await dbAsync.get(
      'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (!address) {
      return res.status(404).json({ error: { message: 'Adres bulunamadı' } });
    }
    
    res.json({ address });
    
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({ error: { message: 'Adres alınırken hata oluştu' } });
  }
});

// Create address
router.post('/', [
  authenticateToken,
  body('title').trim().notEmpty(),
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty(),
  body('phone').trim().notEmpty(),
  body('address_line').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('district').trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const userId = req.user.id;
  const { 
    title, 
    first_name, 
    last_name, 
    phone, 
    address_line, 
    city, 
    district, 
    postal_code,
    is_default 
  } = req.body;
  
  try {
    // If setting as default, unset other defaults
    if (is_default) {
      await dbAsync.run(
        'UPDATE addresses SET is_default = 0 WHERE user_id = ?',
        [userId]
      );
    }
    
    const result = await dbAsync.run(
      `INSERT INTO addresses 
       (user_id, title, first_name, last_name, phone, address_line, city, district, postal_code, is_default) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title,
        first_name,
        last_name,
        phone,
        address_line,
        city,
        district,
        postal_code || null,
        is_default ? 1 : 0
      ]
    );
    
    const address = await dbAsync.get(
      'SELECT * FROM addresses WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({ 
      message: 'Adres eklendi',
      address 
    });
    
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ error: { message: 'Adres eklenirken hata oluştu' } });
  }
});

// Update address
router.put('/:id', [
  authenticateToken,
  body('title').optional().trim().notEmpty(),
  body('first_name').optional().trim().notEmpty(),
  body('last_name').optional().trim().notEmpty(),
  body('phone').optional().trim().notEmpty(),
  body('address_line').optional().trim().notEmpty(),
  body('city').optional().trim().notEmpty(),
  body('district').optional().trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const userId = req.user.id;
  const { id } = req.params;
  const { 
    title, 
    first_name, 
    last_name, 
    phone, 
    address_line, 
    city, 
    district, 
    postal_code,
    is_default 
  } = req.body;
  
  try {
    // Check ownership
    const existing = await dbAsync.get(
      'SELECT id FROM addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (!existing) {
      return res.status(404).json({ error: { message: 'Adres bulunamadı' } });
    }
    
    // If setting as default, unset other defaults
    if (is_default) {
      await dbAsync.run(
        'UPDATE addresses SET is_default = 0 WHERE user_id = ?',
        [userId]
      );
    }
    
    await dbAsync.run(
      `UPDATE addresses SET 
       title = COALESCE(?, title),
       first_name = COALESCE(?, first_name),
       last_name = COALESCE(?, last_name),
       phone = COALESCE(?, phone),
       address_line = COALESCE(?, address_line),
       city = COALESCE(?, city),
       district = COALESCE(?, district),
       postal_code = COALESCE(?, postal_code),
       is_default = COALESCE(?, is_default)
       WHERE id = ?`,
      [
        title,
        first_name,
        last_name,
        phone,
        address_line,
        city,
        district,
        postal_code,
        is_default ? 1 : (is_default === false ? 0 : null),
        id
      ]
    );
    
    const address = await dbAsync.get(
      'SELECT * FROM addresses WHERE id = ?',
      [id]
    );
    
    res.json({ 
      message: 'Adres güncellendi',
      address 
    });
    
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: { message: 'Adres güncellenirken hata oluştu' } });
  }
});

// Delete address
router.delete('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  try {
    // Check ownership
    const address = await dbAsync.get(
      'SELECT id, is_default FROM addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (!address) {
      return res.status(404).json({ error: { message: 'Adres bulunamadı' } });
    }
    
    // Check if address is used in any orders
    const orderCount = await dbAsync.get(
      'SELECT COUNT(*) as count FROM orders WHERE shipping_address_id = ? OR billing_address_id = ?',
      [id, id]
    );
    
    if (orderCount && orderCount.count > 0) {
      return res.status(400).json({ 
        error: { 
          message: `Bu adres ${orderCount.count} siparişte kullanılıyor ve silinemez` 
        } 
      });
    }
    
    await dbAsync.run(
      'DELETE FROM addresses WHERE id = ?',
      [id]
    );
    
    // If deleted address was default, set first remaining address as default
    if (address.is_default) {
      const firstAddress = await dbAsync.get(
        'SELECT id FROM addresses WHERE user_id = ? LIMIT 1',
        [userId]
      );
      
      if (firstAddress) {
        await dbAsync.run(
          'UPDATE addresses SET is_default = 1 WHERE id = ?',
          [firstAddress.id]
        );
      }
    }
    
    res.json({ message: 'Adres silindi' });
    
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: { message: 'Adres silinirken hata oluştu' } });
  }
});

// Set default address
router.post('/:id/set-default', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  try {
    // Check ownership
    const address = await dbAsync.get(
      'SELECT id FROM addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (!address) {
      return res.status(404).json({ error: { message: 'Adres bulunamadı' } });
    }
    
    // Unset all defaults
    await dbAsync.run(
      'UPDATE addresses SET is_default = 0 WHERE user_id = ?',
      [userId]
    );
    
    // Set new default
    await dbAsync.run(
      'UPDATE addresses SET is_default = 1 WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Varsayılan adres güncellendi' });
    
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ error: { message: 'Varsayılan adres ayarlanırken hata oluştu' } });
  }
});

module.exports = router;
