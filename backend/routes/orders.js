const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { dbAsync } = require('../config/database');

const router = express.Router();

// ============================================
// ADMIN ROUTES - BUNLAR EN ÜSTTE OLMALI!
// ============================================

// Admin: Get dashboard stats
router.get('/admin/stats', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: { message: 'Yetkiniz yok' } });
  }
  
  try {
    const totalProducts = await dbAsync.get('SELECT COUNT(*) as count FROM products');
    
    const pendingOrders = await dbAsync.get(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE status IN ('pending', 'Hazırlanıyor', 'processing', 'confirmed', 'shipped')
    `);

    const totalCustomers = await dbAsync.get("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
    const monthlySales = await dbAsync.get(`
      SELECT COALESCE(SUM(total), 0) as total 
      FROM orders 
      WHERE created_at >= datetime('now', '-30 days')
      AND status != 'cancelled'
    `);
    
    res.json({
      totalProducts: totalProducts.count,
      pendingOrders: pendingOrders.count,
      totalCustomers: totalCustomers.count,
      monthlySales: monthlySales.total
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: { message: 'İstatistikler yüklenemedi' } });
  }
});

// Admin: Get all orders
router.get('/admin', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: { message: 'Yetkiniz yok' } });
  }
  
  try {
    const { status, limit = 50, offset = 0, sort = '-created_at' } = req.query;
    
    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortOrder = sort.startsWith('-') ? 'DESC' : 'ASC';
    
    let query = `
      SELECT o.*, 
             u.email, u.full_name as customer_name,
             a.first_name || ' ' || a.last_name as shipping_name,
             a.city || ', ' || a.district as shipping_location
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN addresses a ON o.shipping_address_id = a.id
    `;
    
    const params = [];
    
    if (status) {
      query += ' WHERE o.status = ?';
      params.push(status);
    }
    
    query += ` ORDER BY o.${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const orders = await dbAsync.all(query, params);
    
    for (let order of orders) {
      const itemsCount = await dbAsync.get(
        'SELECT COUNT(*) as count, SUM(quantity) as total_items FROM order_items WHERE order_id = ?',
        [order.id]
      );
      order.items_count = itemsCount.total_items || 0;
    }
    
    const totalCount = await dbAsync.get(
      status 
        ? 'SELECT COUNT(*) as count FROM orders WHERE status = ?'
        : 'SELECT COUNT(*) as count FROM orders',
      status ? [status] : []
    );
    
    res.json({
      orders,
      pagination: {
        total: totalCount.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: { message: 'Siparişler alınırken hata oluştu' } });
  }
});

// Admin: Get single order (any order)
router.get('/admin/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: { message: 'Yetkiniz yok' } });
  }
  
  const { id } = req.params;
  
  try {
    const order = await dbAsync.get(
      `SELECT o.*, 
              a.title as address_title,
              a.first_name, a.last_name, a.phone,
              a.address_line, a.city, a.district
       FROM orders o
       LEFT JOIN addresses a ON o.shipping_address_id = a.id
       WHERE o.id = ?`,
      [id]
    );
    
    if (!order) {
      return res.status(404).json({ error: { message: 'Sipariş bulunamadı' } });
    }
    
    const items = await dbAsync.all(
      `SELECT oi.*, p.name, p.slug,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );
    
    order.items = items;
    
    res.json(order);
    
  } catch (error) {
    console.error('Get admin order error:', error);
    res.status(500).json({ error: { message: 'Sipariş alınırken hata oluştu' } });
  }
});

// Admin: Update order status
router.put('/admin/:id/status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: { message: 'Yetkiniz yok' } });
  }
  
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: { message: 'Geçersiz durum' } });
  }
  
  try {
    const order = await dbAsync.get('SELECT * FROM orders WHERE id = ?', [id]);
    
    if (!order) {
      return res.status(404).json({ error: { message: 'Sipariş bulunamadı' } });
    }
    
    await dbAsync.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    
    const updatedOrder = await dbAsync.get('SELECT * FROM orders WHERE id = ?', [id]);
    
    res.json({ 
      message: 'Sipariş durumu güncellendi',
      order: updatedOrder
    });
    
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: { message: 'Durum güncellenirken hata oluştu' } });
  }
});

// ============================================
// USER ROUTES - BUNLAR ADMIN'DEN SONRA
// ============================================

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { items, shipping_address, payment_method, subtotal, shipping_cost, total, notes } = req.body;
  
  try {
    if (!items || items.length === 0) {
      return res.status(400).json({ error: { message: 'Sipariş boş olamaz' } });
    }
    
    const addressResult = await dbAsync.run(
      `INSERT INTO addresses (user_id, title, first_name, last_name, phone, address_line, city, district, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        userId,
        shipping_address.title,
        shipping_address.first_name,
        shipping_address.last_name,
        shipping_address.phone,
        shipping_address.address_line,
        shipping_address.city,
        shipping_address.district
      ]
    );
    
    const addressId = addressResult.lastID;
    const orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    const orderResult = await dbAsync.run(
      `INSERT INTO orders (user_id, order_number, status, subtotal, shipping_cost, total, payment_method, shipping_address_id, notes)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      [userId, orderNumber, subtotal, shipping_cost, total, payment_method, addressId, notes]
    );
    
    const orderId = orderResult.lastID;
    
    for (const item of items) {
      const product = await dbAsync.get(
        'SELECT name, price FROM products WHERE id = ?',
        [item.product_id]
      );
      
      if (!product) {
        throw new Error(`Ürün bulunamadı: ${item.product_id}`);
      }
      
      await dbAsync.run(
        `INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price, item.price * item.quantity]
      );
      
      await dbAsync.run(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }
    
    await dbAsync.run('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    
    res.status(201).json({
      message: 'Sipariş oluşturuldu',
      orderId,
      orderNumber
    });
    
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: { message: error.message || 'Sipariş oluşturulurken hata oluştu' } });
  }
});

// Get user orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const orders = await dbAsync.all(
      `SELECT o.*, 
              a.first_name || ' ' || a.last_name as shipping_name,
              a.city || ', ' || a.district as shipping_location
       FROM orders o
       LEFT JOIN addresses a ON o.shipping_address_id = a.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );
    
    for (let order of orders) {
      const items = await dbAsync.all(
        `SELECT oi.*, p.name, p.slug,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }
    
    res.json({ orders });
    
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: { message: 'Siparişler alınırken hata oluştu' } });
  }
});

// Get single order (user's own order)
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    const order = await dbAsync.get(
      `SELECT o.*, 
              a.title as address_title,
              a.first_name, a.last_name, a.phone,
              a.address_line, a.city, a.district
       FROM orders o
       LEFT JOIN addresses a ON o.shipping_address_id = a.id
       WHERE o.id = ? AND o.user_id = ?`,
      [id, userId]
    );
    
    if (!order) {
      return res.status(404).json({ error: { message: 'Sipariş bulunamadı' } });
    }
    
    const items = await dbAsync.all(
      `SELECT oi.*, p.name, p.slug,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );
    
    order.items = items;
    
    res.json(order);
    
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: { message: 'Sipariş alınırken hata oluştu' } });
  }
});

module.exports = router;
