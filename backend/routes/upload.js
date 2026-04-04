const express = require('express');
const upload = require('../middleware/upload');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { dbAsync } = require('../config/database');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Upload single image
router.post('/image', [authenticateToken, isAdmin, upload.single('image')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'Dosya yüklenmedi' } });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;
    
    res.status(201).json({
      message: 'Dosya başarıyla yüklendi',
      imageUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: { message: 'Dosya yüklenirken hata oluştu' } });
  }
});

// Upload multiple images
router.post('/images', [authenticateToken, isAdmin, upload.array('images', 5)], async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: { message: 'Dosya yüklenmedi' } });
    }

    const images = req.files.map(file => ({
      imageUrl: `/uploads/products/${file.filename}`,
      filename: file.filename,
      size: file.size
    }));
    
    res.status(201).json({
      message: 'Dosyalar başarıyla yüklendi',
      images
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: { message: 'Dosyalar yüklenirken hata oluştu' } });
  }
});

// Delete image
router.delete('/image/:filename', [authenticateToken, isAdmin], async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/products', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Dosya silindi' });
    } else {
      res.status(404).json({ error: { message: 'Dosya bulunamadı' } });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: { message: 'Dosya silinirken hata oluştu' } });
  }
});

// Add image to product
router.post('/product/:productId/image', [authenticateToken, isAdmin], async (req, res) => {
  const { productId } = req.params;
  const { imageUrl, isPrimary = 0, displayOrder = 0 } = req.body;
  
  try {
    // If setting as primary, unset other primary images
    if (isPrimary) {
      await dbAsync.run(
        'UPDATE product_images SET is_primary = 0 WHERE product_id = ?',
        [productId]
      );
    }
    
    const result = await dbAsync.run(
      'INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)',
      [productId, imageUrl, isPrimary ? 1 : 0, displayOrder]
    );
    
    res.status(201).json({
      message: 'Görsel ürüne eklendi',
      imageId: result.lastID
    });
  } catch (error) {
    console.error('Add image to product error:', error);
    res.status(500).json({ error: { message: 'Görsel eklenirken hata oluştu' } });
  }
});

module.exports = router;
// Delete product image
router.delete('/product-image/:imageId', [authenticateToken, isAdmin], async (req, res) => {
  const { imageId } = req.params;
  
  try {
    // Get image info
    const image = await dbAsync.get(
      'SELECT * FROM product_images WHERE id = ?',
      [imageId]
    );
    
    if (!image) {
      return res.status(404).json({ error: { message: 'Görsel bulunamadı' } });
    }
    
    // Delete from database
    await dbAsync.run('DELETE FROM product_images WHERE id = ?', [imageId]);
    
    // Delete file from disk
    try {
      const filename = path.basename(image.image_url);
      const filePath = path.join(__dirname, '../uploads/products', filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error('File delete error:', fileError);
      // Continue even if file deletion fails
    }
    
    res.json({ message: 'Görsel silindi' });
  } catch (error) {
    console.error('Delete product image error:', error);
    res.status(500).json({ error: { message: 'Görsel silinirken hata oluştu' } });
  }
});

// Update product image primary status
router.put('/product-image/:imageId/primary', [authenticateToken, isAdmin], async (req, res) => {
  const { imageId } = req.params;
  const { is_primary } = req.body;
  
  try {
    // If setting as primary, unset others first
    if (is_primary) {
      const image = await dbAsync.get(
        'SELECT product_id FROM product_images WHERE id = ?',
        [imageId]
      );
      
      if (image) {
        await dbAsync.run(
          'UPDATE product_images SET is_primary = 0 WHERE product_id = ?',
          [image.product_id]
        );
      }
    }
    
    // Update this image
    await dbAsync.run(
      'UPDATE product_images SET is_primary = ? WHERE id = ?',
      [is_primary ? 1 : 0, imageId]
    );
    
    res.json({ message: 'Görsel güncellendi' });
  } catch (error) {
    console.error('Update image primary error:', error);
    res.status(500).json({ error: { message: 'Görsel güncellenirken hata oluştu' } });
  }
});
