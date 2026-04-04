const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { dbAsync } = require('../config/database');

const router = express.Router();

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const items = await dbAsync.all(
      `SELECT ci.*, p.name, p.price, p.discount_price, p.slug,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?`,
      [userId]
    );
    
    const itemsWithPrices = items.map(item => ({
      ...item,
      price: item.discount_price || item.price
    }));
    
    res.json({ items: itemsWithPrices });
    
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: { message: 'Sepet alınırken hata oluştu' } });
  }
});

// Add to cart
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { product_id, quantity = 1 } = req.body;
  
  console.log('=== ADD TO CART ===');
  console.log('userId:', userId);
  console.log('product_id:', product_id);
  console.log('quantity:', quantity);
  
  try {
    console.log('Checking product...');
    const product = await dbAsync.get(
      'SELECT id, name, price, discount_price, stock_quantity FROM products WHERE id = ?',
      [product_id]
    );
    
    console.log('Product result:', product);
    
    if (!product) {
      console.log('Product not found');
      return res.status(404).json({ error: { message: 'Ürün bulunamadı' } });
    }
    
    if (product.stock_quantity < quantity) {
      return res.status(400).json({ error: { message: 'Stokta yeterli ürün yok' } });
    }
    
    const existingItem = await dbAsync.get(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );
    
    if (existingItem) {
      console.log('Item exists, updating quantity');
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.stock_quantity < newQuantity) {
        return res.status(400).json({ error: { message: 'Stokta yeterli ürün yok' } });
      }
      
      await dbAsync.run(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [newQuantity, existingItem.id]
      );
      
      console.log('Cart updated');
      res.json({ message: 'Sepet güncellendi', itemId: existingItem.id });
    } else {
      console.log('Adding new item to cart');
      const result = await dbAsync.run(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, product_id, quantity]
      );
      
      console.log('Item added, ID:', result.lastID);
      res.status(201).json({ message: 'Sepete eklendi', itemId: result.lastID });
    }
    
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: { message: 'Sepete eklenirken hata oluştu: ' + error.message } });
  }
});

// Update cart item quantity
router.put('/:productId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const { quantity } = req.body;
  
  try {
    if (quantity < 1) {
      return res.status(400).json({ error: { message: 'Miktar en az 1 olmalıdır' } });
    }
    
    const product = await dbAsync.get(
      'SELECT stock_quantity FROM products WHERE id = ?',
      [productId]
    );
    
    if (!product) {
      return res.status(404).json({ error: { message: 'Ürün bulunamadı' } });
    }
    
    if (product.stock_quantity < quantity) {
      return res.status(400).json({ error: { message: 'Stokta yeterli ürün yok' } });
    }
    
    await dbAsync.run(
      'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [quantity, userId, productId]
    );
    
    res.json({ message: 'Sepet güncellendi' });
    
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: { message: 'Sepet güncellenirken hata oluştu' } });
  }
});

// Remove from cart
router.delete('/:productId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  
  try {
    await dbAsync.run(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    
    res.json({ message: 'Ürün sepetten çıkarıldı' });
    
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: { message: 'Ürün çıkarılırken hata oluştu' } });
  }
});

module.exports = router;