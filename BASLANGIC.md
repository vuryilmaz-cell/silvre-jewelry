# Silvre Jewelry - Hızlı Başlangıç Rehberi

## 🚀 Kurulum Adımları

### 1. Gereksinimler

- Node.js (v16 veya üstü)
- npm veya yarn

### 2. Backend Kurulumu

```bash
# Proje klasörüne gidin
cd silvre-jewelry/backend

# Bağımlılıkları yükleyin
npm install

# .env dosyasını oluşturun
cp .env.example .env

# .env dosyasını düzenleyin (önemli!)
# - JWT_SECRET: Güçlü bir secret key girin
# - ADMIN_EMAIL ve ADMIN_PASSWORD: İlk admin kullanıcısı
# - Email ayarları (sipariş bildirimleri için)

# Veritabanını başlatın
npm run init-db

# Sunucuyu başlatın
npm run dev
```

Backend şimdi http://localhost:5000 adresinde çalışıyor.

### 3. Frontend Kurulumu

Frontend için basit bir HTTP sunucu yeterli:

```bash
# Frontend klasörüne gidin
cd ../frontend

# HTTP sunucu ile çalıştırın
npx http-server -p 3000

# VEYA Python ile
python -m http.server 3000

# VEYA VS Code Live Server extension kullanın
```

Frontend şimdi http://localhost:3000 adresinde çalışıyor.

### 4. Admin Panel

```bash
# Admin klasörüne gidin
cd ../admin

# HTTP sunucu ile çalıştırın
npx http-server -p 3001
```

Admin panel şimdi http://localhost:3001 adresinde çalışıyor.

**İlk Giriş:**

- Email: .env dosyasında belirlediğiniz ADMIN_EMAIL
- Şifre: .env dosyasında belirlediğiniz ADMIN_PASSWORD

---

## 📁 Proje Yapısı

```
silvre-jewelry/
├── backend/                 # Node.js + Express API
│   ├── config/             # Veritabanı konfigürasyonu
│   ├── middleware/         # JWT auth middleware
│   ├── routes/             # API route'ları
│   ├── scripts/            # Veritabanı init script
│   ├── server.js           # Ana sunucu dosyası
│   └── package.json
│
├── frontend/               # Müşteri arayüzü
│   ├── css/
│   │   └── style.css      # Ana stil dosyası
│   ├── js/
│   │   ├── config.js      # API konfigürasyonu
│   │   ├── utils.js       # Yardımcı fonksiyonlar
│   │   ├── api.js         # API client
│   │   ├── app.js         # Global JS
│   │   └── home.js        # Ana sayfa JS
│   ├── index.html         # Ana sayfa
│   └── ...
│
├── admin/                  # Admin paneli
│   ├── css/
│   │   └── admin.css
│   ├── js/
│   │   ├── admin.js
│   │   └── dashboard.js
│   └── index.html
│
└── database/
    └── schema.sql          # Veritabanı şeması
```

---

## 🔑 İlk Adımlar

### 1. Admin Paneline Giriş

- http://localhost:3001 adresine gidin
- .env dosyasındaki admin bilgileri ile giriş yapın

### 2. Ürün Ekleme

- Admin Panel → Ürünler → Yeni Ürün
- Ürün bilgilerini doldurun
- Kategori seçin
- Fiyat ve stok bilgisi girin
- Kaydet

### 3. Kategori Yönetimi

- Admin Panel → Kategoriler
- Varsayılan kategoriler zaten mevcut:
  - Kolyeler
  - Küpeler
  - Yüzükler
  - Bileklikler
  - Setler

### 4. Görsel Yükleme

Şu an için görseller manuel olarak `/backend/uploads` klasörüne konulmalı.
Gelecekte:

- Multer ile dosya yükleme eklenecek
- Admin panelde sürükle-bırak upload

---

## 🛠️ Geliştirme

### Backend API Testi

```bash
# Health check
curl http://localhost:5000/api/health

# Ürünleri listele
curl http://localhost:5000/api/products

# Kategorileri listele
curl http://localhost:5000/api/categories
```

### Veritabanını Sıfırlama

```bash
cd backend
rm database/silvre.db
npm run init-db
```

---

## 📦 Production Deployment

### Backend (Railway / Render)

```bash
# .env dosyasını production için ayarlayın
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://... (PostgreSQL kullanacaksanız)

# Deploy
git push railway main
# veya
render deploy
```

### Frontend (Netlify / Vercel)

```bash
# Frontend klasörünü deploy edin
cd frontend
netlify deploy --prod

# Veya Vercel
vercel --prod
```

**Önemli:** Frontend'deki `js/config.js` dosyasında API_CONFIG.BASE_URL'i production API adresinize güncelleyin.

---

## 🔐 Güvenlik Notları

1. **Production .env:**

   - Güçlü JWT_SECRET kullanın (en az 32 karakter)
   - Database şifrelerini güçlü yapın
   - Email credentials'ı güvenli saklayın

2. **CORS:**

   - Production'da FRONTEND_URL ve ADMIN_URL'i gerçek domain'lerinize ayarlayın

3. **SSL:**

   - Production'da mutlaka HTTPS kullanın

4. **Rate Limiting:**
   - Express-rate-limit ekleyin (özellikle auth endpoints için)

---

## 🎨 Özelleştirme

### Renk Değişikliği

`frontend/css/style.css` dosyasında CSS değişkenlerini düzenleyin:

```css
:root {
  --color-accent: #8b7355; /* Ana vurgu rengi */
  --color-off-black: #1a1a1a;
  --color-cream: #faf8f5;
  /* ... */
}
```

### Logo Ekleme

- `/frontend/images/logo.png` dosyasını ekleyin
- `index.html` içindeki logo kısmını güncelleyin

---

## 📧 Destek

Sorularınız için:

- GitHub Issues açın
- Email: support@slvr.com.tr

---

## 📝 TODO List

- [ ] Ödeme entegrasyonu (iyzico)
- [ ] Görsel upload özelliği
- [ ] Email bildirimleri (sipariş, kargo)
- [ ] Ürün yorumları moderasyonu
- [ ] Stok uyarı sistemi
- [ ] Toplu ürün import (CSV)
- [ ] WhatsApp Business entegrasyonu
- [ ] Mobil uygulama

---

**Keyifli kodlamalar! 🚀✨**
