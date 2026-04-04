const { initializeDatabase, dbAsync } = require('../config/database');
const bcrypt = require('bcryptjs');

async function initDB() {
  console.log('🔄 Veritabanı başlatılıyor...');

  try {
    // Initialize schema
    await initializeDatabase();

    // Create admin user if not exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@silvre.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

    const existingAdmin = await dbAsync.get('SELECT id FROM users WHERE email = ?', [adminEmail]);

    if (!existingAdmin) {
      const password_hash = await bcrypt.hash(adminPassword, 10);
      await dbAsync.run(
        'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
        [adminEmail, password_hash, 'Admin', 'admin']
      );
      console.log('✅ Admin kullanıcısı oluşturuldu:', adminEmail);
    } else {
      console.log('ℹ️  Admin kullanıcısı zaten mevcut');
    }

    // Add sample products (optional)
    const productCount = await dbAsync.get('SELECT COUNT(*) as count FROM products');
    
    if (productCount.count === 0) {
      console.log('📦 Örnek ürünler ekleniyor...');

      const categories = await dbAsync.all('SELECT id, slug FROM categories');
      const kolyeCategory = categories.find(c => c.slug === 'kolyeler');

      if (kolyeCategory) {
        const sampleProducts = [
          {
            name: 'Minimal Zincir Kolye',
            slug: 'minimal-zincir-kolye',
            description: '925 ayar gümüş minimal tasarım zincir kolye. Günlük kullanıma uygundur.',
            price: 450,
            stock_quantity: 10,
            sku: 'SLV-KLY-001',
            is_featured: 1
          },
          {
            name: 'Kalp Uçlu Kolye',
            slug: 'kalp-uclu-kolye',
            description: 'Zarif kalp detaylı 925 ayar gümüş kolye.',
            price: 550,
            discount_price: 495,
            stock_quantity: 15,
            sku: 'SLV-KLY-002',
            is_featured: 1
          },
          {
            name: 'İnci Detaylı Kolye',
            slug: 'inci-detayli-kolye',
            description: 'Doğal inci ve 925 ayar gümüş kombinasyonu.',
            price: 750,
            stock_quantity: 8,
            sku: 'SLV-KLY-003'
          }
        ];

        for (const product of sampleProducts) {
          await dbAsync.run(`
            INSERT INTO products (
              category_id, name, slug, description, price, discount_price,
              stock_quantity, sku, is_featured
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            kolyeCategory.id, product.name, product.slug, product.description,
            product.price, product.discount_price || null, product.stock_quantity,
            product.sku, product.is_featured || 0
          ]);
        }

        console.log('✅ Örnek ürünler eklendi');
      }
    }

    console.log('✅ Veritabanı başlatma tamamlandı!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Veritabanı başlatma hatası:', error);
    process.exit(1);
  }
}

initDB();
