const express = require("express");
const { body, validationResult } = require("express-validator");
const { dbAsync } = require("../config/database");
const {
  authenticateToken,
  isAdmin,
  optionalAuth,
} = require("../middleware/auth");

const router = express.Router();

// Helper: Generate slug from Turkish text
function generateSlug(text) {
  const trMap = {
    ç: "c",
    Ç: "c",
    ğ: "g",
    Ğ: "g",
    ı: "i",
    İ: "i",
    ö: "o",
    Ö: "o",
    ş: "s",
    Ş: "s",
    ü: "u",
    Ü: "u",
  };

  return text
    .split("")
    .map((char) => trMap[char] || char)
    .join("")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Get all products (with filters)
router.get("/", optionalAuth, async (req, res) => {
  const {
    category,
    gender,
    featured,
    search,
    sort = "display_order",
    order = "ASC",
    limit = 20,
    offset = 0,
  } = req.query;

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
    const isAdminUser = req.user && req.user.role === "admin";
    if (!isAdminUser) {
      query += " AND p.is_active = 1";
    }

    // Filters
    if (category) {
      query += " AND c.slug = ?";
      params.push(category);
    }

    if (gender) {
      query += " AND p.gender = ?";
      params.push(gender);
    }

    if (featured === "true") {
      query += " AND p.is_featured = 1";
    }

    if (search) {
      query += " AND (p.name LIKE ? OR p.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sorting - display_order desteği eklendi
    const allowedSorts = [
      "created_at",
      "price",
      "name",
      "views",
      "display_order",
    ];
    const sortField = allowedSorts.includes(sort) ? sort : "display_order";
    const sortOrder = order.toUpperCase() === "DESC" ? "DESC" : "ASC";
    query += ` ORDER BY p.${sortField} ${sortOrder}`;

    // Pagination
    query += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const products = await dbAsync.all(query, params);

    // Get total count
    let countQuery =
      "SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1";
    const countParams = [];

    // ✅ Admin tüm ürünleri sayar, public sadece aktif olanları
    if (!isAdminUser) {
      countQuery += " AND p.is_active = 1";
    }

    if (category) {
      countQuery += " AND c.slug = ?";
      countParams.push(category);
    }
    if (gender) {
      countQuery += " AND p.gender = ?";
      countParams.push(gender);
    }
    if (featured === "true") {
      countQuery += " AND p.is_featured = 1";
    }
    if (search) {
      countQuery += " AND (p.name LIKE ? OR p.description LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const { total } = await dbAsync.get(countQuery, countParams);

    res.json({
      products,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + products.length < total,
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    res
      .status(500)
      .json({ error: { message: "Ürünler alınırken hata oluştu" } });
  }
});

// Get single product
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    // ✅ Admin tüm ürünleri görebilir, public sadece aktif olanları
    const isAdminUser = req.user && req.user.role === "admin";
    const activeCondition = isAdminUser ? "" : "AND p.is_active = 1";

    const product = await dbAsync.get(
      `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? ${activeCondition}
    `,
      [req.params.id]
    );

    if (!product) {
      return res.status(404).json({ error: { message: "Ürün bulunamadı" } });
    }

    // Get product images
    const images = await dbAsync.all(
      "SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, display_order",
      [req.params.id]
    );

    // Get reviews
    const reviews = await dbAsync.all(
      `
      SELECT r.*, u.full_name as user_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.is_approved = 1
      ORDER BY r.created_at DESC
    `,
      [req.params.id]
    );

    // Calculate average rating
    const ratingData = await dbAsync.get(
      "SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE product_id = ? AND is_approved = 1",
      [req.params.id]
    );

    // Increment view count
    await dbAsync.run("UPDATE products SET views = views + 1 WHERE id = ?", [
      req.params.id,
    ]);

    // Check if favorited by user
    let isFavorite = false;
    if (req.user) {
      const favorite = await dbAsync.get(
        "SELECT id FROM favorites WHERE user_id = ? AND product_id = ?",
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
      is_favorite: isFavorite,
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ error: { message: "Ürün alınırken hata oluştu" } });
  }
});

// Create product (Admin only)
router.post("/", [authenticateToken, isAdmin], async (req, res) => {
  let {
    category_id,
    name,
    slug,
    description,
    price,
    discount_price,
    stock_quantity,
    sku,
    material,
    weight,
    gender,
    is_featured,
    display_order,
  } = req.body;

  try {
    // Auto-generate slug if not provided
    if (!slug) {
      slug = generateSlug(name);

      // Ensure slug is unique
      const existing = await dbAsync.get(
        "SELECT id FROM products WHERE slug = ?",
        [slug]
      );
      if (existing) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    // ✅ display_order yoksa, en son sırayı al ve +1 ekle
    if (display_order === undefined || display_order === null) {
      const maxOrder = await dbAsync.get(
        "SELECT MAX(display_order) as max_order FROM products"
      );
      display_order = (maxOrder.max_order || 0) + 1;
    }

    const result = await dbAsync.run(
      `
      INSERT INTO products (
        category_id, name, slug, description, price, discount_price,
        stock_quantity, sku, material, weight, gender, is_featured, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        category_id,
        name,
        slug,
        description || "",
        price,
        discount_price || null,
        stock_quantity || 0,
        sku || null,
        material || "925 Ayar Gümüş",
        weight || null,
        gender || "unisex",
        is_featured ? 1 : 0,
        display_order,
      ]
    );

    res.status(201).json({
      message: "Ürün başarıyla eklendi",
      productId: result.lastID,
      slug,
      display_order,
    });
  } catch (error) {
    console.error("Create product error:", error);
    if (error.message.includes("UNIQUE")) {
      res
        .status(400)
        .json({ error: { message: "Bu slug veya SKU zaten kullanılıyor" } });
    } else {
      res
        .status(500)
        .json({ error: { message: "Ürün eklenirken hata oluştu" } });
    }
  }
});

// Update product (Admin only)
router.put("/:id", [authenticateToken, isAdmin], async (req, res) => {
  let {
    category_id,
    name,
    slug,
    description,
    price,
    discount_price,
    stock_quantity,
    sku,
    material,
    weight,
    gender,
    is_featured,
    is_active,
    display_order,
  } = req.body;

  try {
    // Auto-generate slug if not provided
    if (!slug) {
      slug = generateSlug(name);
    }

    // Mevcut ürünü al - material ve weight yoksa mevcut değerleri kullan
    const existing = await dbAsync.get(
      "SELECT material, weight FROM products WHERE id = ?",
      [req.params.id]
    );

    if (!existing) {
      return res.status(404).json({ error: { message: "Ürün bulunamadı" } });
    }

    await dbAsync.run(
      `
      UPDATE products SET
        category_id = ?, name = ?, slug = ?, description = ?,
        price = ?, discount_price = ?, stock_quantity = ?,
        sku = ?, material = ?, weight = ?, gender = ?, is_featured = ?,
        is_active = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        category_id,
        name,
        slug,
        description || "",
        price,
        discount_price || null,
        stock_quantity,
        sku || null,
        material !== undefined ? material : existing.material,
        weight !== undefined ? weight : existing.weight,
        gender || "unisex",
        is_featured ? 1 : 0,
        is_active ? 1 : 0,
        display_order || 0,
        req.params.id,
      ]
    );

    res.json({ message: "Ürün başarıyla güncellendi" });
  } catch (error) {
    console.error("Update product error:", error);
    res
      .status(500)
      .json({ error: { message: "Ürün güncellenirken hata oluştu" } });
  }
});

// Reorder products (Admin only) - Toplu sıralama
router.put("/reorder", [authenticateToken, isAdmin], async (req, res) => {
  const { orders } = req.body; // [{ id: 1, display_order: 0 }, { id: 2, display_order: 1 }, ...]

  if (!orders || !Array.isArray(orders)) {
    return res
      .status(400)
      .json({ error: { message: "Geçersiz veri formatı" } });
  }

  try {
    // Her ürünün sırasını güncelle
    for (const item of orders) {
      await dbAsync.run(
        "UPDATE products SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [item.display_order, item.id]
      );
    }

    res.json({
      message: "Ürün sıralaması güncellendi",
      updated: orders.length,
    });
  } catch (error) {
    console.error("Reorder products error:", error);
    res
      .status(500)
      .json({ error: { message: "Sıralama güncellenirken hata oluştu" } });
  }
});

// Delete product (Admin only)
router.delete("/:id", [authenticateToken, isAdmin], async (req, res) => {
  const { id } = req.params;
  const { force } = req.query; // ?force=true ile zorunlu silme

  try {
    // 1. Ürünün varlığını kontrol et
    const product = await dbAsync.get("SELECT id FROM products WHERE id = ?", [
      id,
    ]);

    if (!product) {
      return res.status(404).json({ error: { message: "Ürün bulunamadı" } });
    }

    // 2. Sipariş kontrolü
    const orderItems = await dbAsync.get(
      "SELECT COUNT(*) as count FROM order_items WHERE product_id = ?",
      [id]
    );

    if (orderItems.count > 0 && force !== "true") {
      // Sipariş varsa soft delete yap (pasif yap)
      await dbAsync.run(
        `UPDATE products 
         SET is_active = 0, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [id]
      );

      return res.json({
        message: "Ürün pasif hale getirildi (sipariş geçmişinde kullanılmış)",
        softDeleted: true,
      });
    }

    // 3. İlişkili verileri sil (sipariş yoksa veya force=true)
    await dbAsync.run("DELETE FROM product_images WHERE product_id = ?", [id]);
    await dbAsync.run("DELETE FROM favorites WHERE product_id = ?", [id]);
    await dbAsync.run("DELETE FROM cart_items WHERE product_id = ?", [id]);
    await dbAsync.run("DELETE FROM reviews WHERE product_id = ?", [id]);

    // Force delete ise sipariş kalemlerini de sil
    if (force === "true") {
      await dbAsync.run("DELETE FROM order_items WHERE product_id = ?", [id]);
    }

    // 4. Ürünü sil
    await dbAsync.run("DELETE FROM products WHERE id = ?", [id]);

    res.json({
      message: "Ürün başarıyla silindi",
      hardDeleted: true,
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      error: {
        message: "Ürün silinirken hata oluştu: " + error.message,
      },
    });
  }
});

module.exports = router;
