// frontend/js/seo-utils.js
// SEO Yardımcı Fonksiyonları

const SEO = {
  /**
   * Sayfa başlığını güncelle
   */
  updateTitle(title, suffix = ' | Silvre Jewelry') {
    document.title = title + suffix;
  },

  /**
   * Meta description güncelle
   */
  updateDescription(description) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    }
  },

  /**
   * Meta keywords güncelle
   */
  updateKeywords(keywords) {
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords);
    }
  },

  /**
   * Canonical URL güncelle
   */
  updateCanonical(url) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  },

  /**
   * Open Graph meta taglarını güncelle
   */
  updateOG(data) {
    const ogTags = {
      'og:title': data.title,
      'og:description': data.description,
      'og:url': data.url || window.location.href,
      'og:image': data.image,
      'og:type': data.type || 'website'
    };

    Object.keys(ogTags).forEach(property => {
      if (ogTags[property]) {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', ogTags[property]);
      }
    });
  },

  /**
   * Twitter Card meta taglarını güncelle
   */
  updateTwitterCard(data) {
    const twitterTags = {
      'twitter:title': data.title,
      'twitter:description': data.description,
      'twitter:image': data.image,
      'twitter:card': data.card || 'summary_large_image'
    };

    Object.keys(twitterTags).forEach(name => {
      if (twitterTags[name]) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', twitterTags[name]);
      }
    });
  },

  /**
   * Breadcrumb schema ekle/güncelle
   */
  updateBreadcrumb(items) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url
      }))
    };

    let scriptTag = document.getElementById('breadcrumbSchema');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('type', 'application/ld+json');
      scriptTag.setAttribute('id', 'breadcrumbSchema');
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schema);
  },

  /**
   * Product schema ekle/güncelle
   */
  updateProductSchema(product) {
    const schema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": product.images || [],
      "description": product.description,
      "sku": product.sku,
      "brand": {
        "@type": "Brand",
        "name": "Silvre"
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "TRY",
        "price": product.discount_price || product.price,
        "availability": product.stock_quantity > 0 
          ? "https://schema.org/InStock" 
          : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    };

    if (product.avg_rating && product.review_count) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": product.avg_rating,
        "reviewCount": product.review_count
      };
    }

    let scriptTag = document.getElementById('productSchema');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('type', 'application/ld+json');
      scriptTag.setAttribute('id', 'productSchema');
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schema, null, 2);
  },

  /**
   * Tüm SEO taglarını tek seferde güncelle (ürün sayfası için)
   */
  updateProductPage(product) {
    const productName = product.name;
    const categoryName = product.category_name || '';
    
    // Title
    this.updateTitle(`${productName} - 925 Ayar Gümüş ${categoryName}`);
    
    // Description
    const desc = `${productName} - ${product.description.substring(0, 150)}. 925 ayar gümüş, ücretsiz kargo. Fiyat: ${product.price} TL`;
    this.updateDescription(desc);
    
    // Keywords
    this.updateKeywords(`${productName}, gümüş ${categoryName}, 925 ayar, ${product.sku}, gümüş takı`);
    
    // Canonical
    this.updateCanonical(window.location.href);
    
    // Open Graph
    this.updateOG({
      title: productName,
      description: product.description,
      image: product.primary_image || product.images?.[0]?.image_url,
      type: 'product'
    });
    
    // Twitter Card
    this.updateTwitterCard({
      title: productName,
      description: product.description,
      image: product.primary_image || product.images?.[0]?.image_url
    });
    
    // Product Schema
    this.updateProductSchema(product);
    
    // Breadcrumb
    this.updateBreadcrumb([
      { name: 'Ana Sayfa', url: 'https://silvre.com' },
      { name: 'Ürünler', url: 'https://silvre.com/products.html' },
      { name: categoryName, url: `https://silvre.com/categories.html?category=${product.category_slug}` },
      { name: productName, url: window.location.href }
    ]);
  },

  /**
   * URL'yi SEO-friendly hale getir
   */
  slugify(text) {
    const trMap = {
      'ç': 'c', 'Ç': 'c',
      'ğ': 'g', 'Ğ': 'g',
      'ı': 'i', 'İ': 'i',
      'ö': 'o', 'Ö': 'o',
      'ş': 's', 'Ş': 's',
      'ü': 'u', 'Ü': 'u'
    };
    
    return text
      .split('')
      .map(char => trMap[char] || char)
      .join('')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  /**
   * Lazy loading resimleri ekle
   */
  enableLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      images.forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
  }
};

// Global scope'a ekle
window.SEO = SEO;
