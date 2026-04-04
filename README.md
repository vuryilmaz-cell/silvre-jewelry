# Silvre Jewelry E-Ticaret Platformu

Modern, full-stack gümüş takı e-ticaret web sitesi.

## Teknoloji Stack

### Backend
- Node.js + Express
- SQLite (PostgreSQL'e kolayca geçilebilir)
- JWT Authentication
- iyzico Payment Integration

### Frontend
- Vanilla JavaScript (Modern ES6+)
- Responsive Design (Mobile-first)
- LocalStorage + Fetch API

### Admin Panel
- Ürün yönetimi
- Sipariş takibi
- Müşteri yönetimi
- Stok kontrolü

## Kurulum

### 1. Backend Kurulumu
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend/Admin Çalıştırma
```bash
# Basit HTTP sunucu ile
npx http-server frontend -p 3000
npx http-server admin -p 3001
```

Veya doğrudan tarayıcıda açabilirsiniz.

## Özellikler

### Müşteri Tarafı
- ✅ Ürün listeleme ve filtreleme
- ✅ Detaylı ürün sayfaları
- ✅ Sepet yönetimi
- ✅ Kullanıcı kayıt/giriş
- ✅ Güvenli ödeme (iyzico)
- ✅ Sipariş takibi
- ✅ Favori ürünler

### Admin Paneli
- ✅ Ürün CRUD işlemleri
- ✅ Kategori yönetimi
- ✅ Sipariş yönetimi
- ✅ Stok takibi
- ✅ Müşteri listesi
- ✅ Satış raporları

## API Endpoints

### Auth
- POST `/api/auth/register` - Kayıt
- POST `/api/auth/login` - Giriş

### Products
- GET `/api/products` - Tüm ürünler
- GET `/api/products/:id` - Ürün detayı
- POST `/api/products` - Ürün ekle (admin)
- PUT `/api/products/:id` - Ürün güncelle (admin)
- DELETE `/api/products/:id` - Ürün sil (admin)

### Orders
- POST `/api/orders` - Sipariş oluştur
- GET `/api/orders` - Siparişleri listele
- GET `/api/orders/:id` - Sipariş detayı
- PUT `/api/orders/:id/status` - Durum güncelle (admin)

### Categories
- GET `/api/categories` - Kategoriler
- POST `/api/categories` - Kategori ekle (admin)

## Veritabanı Şeması

- **users** - Kullanıcılar
- **products** - Ürünler
- **categories** - Kategoriler
- **orders** - Siparişler
- **order_items** - Sipariş kalemleri

## Deployment

### Backend (Railway/Render)
```bash
# Railway
railway up

# Render
render deploy
```

### Frontend (Netlify/Vercel)
```bash
# Netlify
netlify deploy --prod

# Vercel
vercel --prod
```

## Güvenlik

- JWT ile kimlik doğrulama
- Password hashing (bcrypt)
- SQL injection koruması
- XSS koruması
- CORS yapılandırması
- Rate limiting

## Lisans

MIT
