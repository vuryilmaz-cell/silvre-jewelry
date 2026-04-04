# 🎯 Silvre Jewelry - Tüm Sayfalar için SEO Meta Tags
## ⚠️ ÖNEMLİ: 999 AYAR GÜMÜŞ

---

## 1️⃣ index.html
✅ **SEO TAGLAR ZATEN EKLENMIŞ!**
❌ Sadece 2 satırı düzelt:

**Satır 47-48:**
```html
<meta name="twitter:title" content="Silvre Jewelry - 999 Ayar Gümüş Takılar" />
```

**Satır 50-51:**
```html
<meta name="twitter:description" content="El yapımı 999 ayar gümüş kolye, küpe, yüzük ve bileklik modelleri" />
```

---

## 2️⃣ products.html
**Head bölümüne EKLE (satır 6'dan sonra):**

```html
<!-- SEO Meta Tags -->
<meta name="description" content="Gümüş kolye, küpe, yüzük ve bileklik modellerimizi keşfedin. 999 ayar garantili, el yapımı tasarımlar. Hızlı kargo ve ücretsiz teslimat fırsatı.">
<meta name="keywords" content="gümüş takı satın al, online gümüş takı, 999 ayar takı, gümüş ürünler, el yapımı gümüş">
<meta name="robots" content="index, follow">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://slvr.com.tr/products.html">
<meta property="og:title" content="999 Ayar Gümüş Takı Koleksiyonu">
<meta property="og:description" content="Şık ve zarif gümüş takı modelleri. Kolye, küpe, yüzük ve daha fazlası.">
<meta property="og:image" content="https://slvr.com.tr/images/products-og.jpg">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Gümüş Takı Koleksiyonu - 999 Ayar">
<meta name="twitter:description" content="999 ayar gümüş takılar">

<!-- Canonical URL -->
<link rel="canonical" href="https://slvr.com.tr/products.html">

<!-- Breadcrumb Schema -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [{
    "@type": "ListItem",
    "position": 1,
    "name": "Ana Sayfa",
    "item": "https://slvr.com.tr"
  },{
    "@type": "ListItem",
    "position": 2,
    "name": "Ürünler",
    "item": "https://slvr.com.tr/products.html"
  }]
}
</script>
```

**Title'ı güncelle (satır 6):**
```html
<title>Tüm Ürünler - 999 Ayar Gümüş Takılar | Silvre Jewelry</title>
```

**</head> kapatmadan önce ekle:**
```html
<!-- SEO Utils -->
<script src="js/seo-utils.js"></script>
```

---

## 3️⃣ product.html
**Head bölümüne EKLE (satır 6'dan sonra):**

```html
<!-- SEO Meta Tags - Dinamik -->
<meta name="description" content="999 ayar gümüş takı ürün detayı. El yapımı, özel tasarım.">
<meta name="keywords" content="gümüş takı, 999 ayar, el yapımı">
<meta name="robots" content="index, follow">

<!-- Open Graph -->
<meta property="og:type" content="product">
<meta property="og:url" content="">
<meta property="og:title" content="">
<meta property="og:description" content="">
<meta property="og:image" content="">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="">
<meta name="twitter:description" content="">
<meta name="twitter:image" content="">

<!-- Canonical URL -->
<link rel="canonical" href="">

<!-- Product Schema -->
<script type="application/ld+json" id="productSchema">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "",
  "image": [],
  "description": "",
  "sku": "",
  "brand": {
    "@type": "Brand",
    "name": "Silvre"
  },
  "offers": {
    "@type": "Offer",
    "url": "",
    "priceCurrency": "TRY",
    "price": "",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition"
  }
}
</script>
```

**Title güncelle (satır 6):**
```html
<title>Ürün Detayı - 999 Ayar Gümüş | Silvre Jewelry</title>
```

**</head> kapatmadan önce ekle:**
```html
<script src="js/seo-utils.js"></script>
```

**loadProduct() fonksiyonuna ekle (satır 590'dan sonra):**
```javascript
// SEO Taglarını Güncelle
if (window.SEO && window.SEO.updateProductPage) {
  window.SEO.updateProductPage(product);
}
```

---

## 4️⃣ cart.html
**Head bölümüne EKLE:**

```html
<title>Sepetim | Silvre Jewelry</title>
<meta name="description" content="Alışveriş sepetinizi görüntüleyin ve güvenli ödeme yapın.">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="https://slvr.com.tr/cart.html">
```

---

## 5️⃣ checkout.html
**Head bölümüne EKLE:**

```html
<title>Ödeme | Silvre Jewelry</title>
<meta name="description" content="Güvenli ödeme sayfası. 999 ayar gümüş takılarınızı satın alın.">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="https://slvr.com.tr/checkout.html">
```

---

## 6️⃣ faq.html
**Head bölümüne EKLE:**

```html
<title>Sıkça Sorulan Sorular | Silvre Jewelry</title>
<meta name="description" content="999 ayar gümüş takılar hakkında merak edilenler. Kargo, iade, ürün bakımı ve daha fazlası.">
<meta name="keywords" content="gümüş takı sss, 999 ayar bilgi, gümüş bakımı">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://slvr.com.tr/faq.html">
```

**FAQPage Schema ekle:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "999 ayar gümüş nedir?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "999 ayar gümüş, %99.9 saflıkta gümüştür. En saf gümüş türüdür."
    }
  }]
}
</script>
```

---

## 7️⃣ profile.html
**Head bölümüne EKLE:**

```html
<title>Profilim | Silvre Jewelry</title>
<meta name="description" content="Hesap bilgilerinizi ve siparişlerinizi yönetin.">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="https://slvr.com.tr/profile.html">
```

---

## 8️⃣ register.html
**Head bölümüne EKLE:**

```html
<title>Üye Ol | Silvre Jewelry</title>
<meta name="description" content="Silvre Jewelry'e üye olun, özel fırsatlardan yararlanın.">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="https://slvr.com.tr/register.html">
```

---

## 📋 Özet Checklist

### ✅ Zorunlu (Hemen Yap):
- [x] index.html - Twitter tagları düzelt (999 ayar)
- [ ] products.html - Tam SEO tagları ekle
- [ ] product.html - Dinamik SEO ekle
- [ ] seo-utils.js dosyasını frontend/js/ klasörüne kopyala

### ⚡ Önemli (Kısa Vadede):
- [ ] faq.html - FAQPage schema ekle
- [ ] cart.html - Basic meta tags
- [ ] checkout.html - Basic meta tags

### 💡 İsteğe Bağlı:
- [ ] register.html - Meta tags
- [ ] profile.html - Meta tags

---

## 🎯 Sonraki Adımlar:

1. **seo-utils.js** dosyasını kopyala: `frontend/js/seo-utils.js`
2. **sitemap.xml** kopyala: `frontend/sitemap.xml`
3. **robots.txt** kopyala: `frontend/robots.txt`
4. **Backend'e sitemap route** ekle
5. **Test et** - Localhost'ta çalışıyor mu?
6. **Git'e push et**
7. **Deploy yap**
8. **Google Search Console** - Sitemap gönder

---

## ⚠️ HATIRLATMA:
**Tüm SEO içeriklerinde 925 değil, 999 AYAR kullan!**
