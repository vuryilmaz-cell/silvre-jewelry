// Load header and footer partials
async function loadPartials() {
  try {
    // Load header
    const headerResponse = await fetch('/partials/header.html');
    const headerHTML = await headerResponse.text();
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
      // Use createContextualFragment to execute scripts
      const range = document.createRange();
      range.selectNode(headerContainer);
      const fragment = range.createContextualFragment(headerHTML);
      headerContainer.innerHTML = ''; // Clear first
      headerContainer.appendChild(fragment);
    }
    
    // Load footer
    const footerResponse = await fetch('/partials/footer.html');
    const footerHTML = await footerResponse.text();
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
      const range = document.createRange();
      range.selectNode(footerContainer);
      const fragment = range.createContextualFragment(footerHTML);
      footerContainer.innerHTML = ''; // Clear first
      footerContainer.appendChild(fragment);
    }
    
    // After header loaded, load categories
    await loadNavigationCategories();

    // Mobile menu initialization
    initMobileMenu();

    // Scroll handling
    const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
    const nav = document.querySelector('.nav');
    const badge = document.querySelector('.badge');
    
    if (!isHomePage) {
      // Diğer sayfalarda hep scrolled
      if (nav) nav.classList.add('scrolled');
    } else {
      // Ana sayfada scroll'a göre değişsin
      window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
          nav.classList.add('scrolled');
          badge.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
          badge.classList.remove('scrolled');

        }
      });
    }
    
    // Mobile menu toggle - header.html'deki script ile çakışma olmaması için buradan kaldırıldı
    // Tüm mobile menu mantığı header.html içinde
    
  } catch (error) {
    console.error('Load partials error:', error);
  }
}

// Mobile menu initialization
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const navMenu = document.getElementById("navMenu");
  
  if (!mobileMenuBtn || !navMenu) {
    console.warn("Mobile menu elements not found");
    return;
  }
  
  console.log("Initializing mobile menu...");
  
  // Simple onclick handler
  mobileMenuBtn.onclick = function(e) {
    e.stopPropagation();
    navMenu.classList.toggle("active");
    console.log("Mobile menu toggled:", navMenu.classList.contains("active"));
  };
  
  // Close on outside click
  document.onclick = function(e) {
    if (!navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
      navMenu.classList.remove("active");
    }
  };
  
  console.log("Mobile menu initialized successfully");
}


// Load navigation categories
async function loadNavigationCategories() {
  try {
    const data = await api.getCategories();
    const navMenu = document.getElementById('navMenu');
    
    if (!navMenu) return;
    
    // Check if categories already loaded
    if (navMenu.querySelector('[data-category]')) return;
    
    // Add categories from database (Ana Sayfa ve Ürünler zaten header.html'de var)
    data.categories.forEach(cat => {
      const link = document.createElement('a');
      link.href = `/categories.html?cat=${cat.slug}`;
      link.className = 'nav-link';
      link.textContent = cat.name;
      link.setAttribute('data-category', cat.slug);
      navMenu.appendChild(link);
    });
    
    // Mobile menu link click handlers - kategoriler eklendikten sonra
    navMenu.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("active");
      });
    });
    
    // Set active link
    const currentPath = window.location.pathname;
    const currentCat = new URLSearchParams(window.location.search).get('cat');
    
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      const linkPath = new URL(link.href, window.location.origin).pathname;
      const linkCat = new URLSearchParams(new URL(link.href, window.location.origin).search).get('cat');
      
      if (currentCat && linkCat === currentCat) {
        link.classList.add('active');
      } else if (!currentCat && linkPath === currentPath) {
        link.classList.add('active');
      }
    });
    
  } catch (error) {
    console.error('Load navigation categories error:', error);
  }
}

// Render Product Card
function renderProductCard(product) {
  const price = product.discount_price || product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0;
  
  const imageUrl = product.primary_image 
    ? `${product.primary_image}` 
    : '/uploads/products/placeholder.jpg';
  
  return `
    <div class="product-card">
      ${hasDiscount ? `<span class="product-badge">-${discountPercent}%</span>` : ''}
      ${product.is_featured ? '<span class="product-badge featured">Öne Çıkan</span>' : ''}
      
      <a href="/product.html?id=${product.id}" class="product-image">
        <img src="${imageUrl}" 
             alt="${product.name}"
             onerror="this.src='/uploads/products/placeholder.jpg'">
      </a>
      
      <div class="product-info">
        <h3 class="product-name">
          <a href="/product.html?id=${product.id}">${product.name}</a>
        </h3>
        
        <div class="product-price">
          ${hasDiscount ? `<span class="price-old">${product.price.toFixed(2)} ₺</span>` : ''}
          <span class="price">${price.toFixed(2)} ₺</span>
        </div>
        
        <button class="btn btn-primary btn-block" onclick="addToCartHandler(${product.id})">
          Sepete Ekle
        </button>
      </div>
    </div>
  `;
}

// Render Category Card
function renderCategoryCard(category) {
  return `
    <div class="category-card" onclick="window.location.href='/categories.html?cat=${category.slug}'">
      <div class="category-image">
        <img src="${category.image_url || '/images/category-placeholder.jpg'}" 
             alt="${category.name}">
      </div>
      <div class="category-info">
        <h3 class="category-name">${category.name}</h3>
      </div>
    </div>
  `;
}

// Add to Cart Handler
async function addToCartHandler(productId, quantity = 1) {
  if (!auth.isAuthenticated()) {
    showToast('Sepete eklemek için giriş yapmalısınız', 'error');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1500);
    return;
  }
  
  try {
    await api.addToCart(productId, quantity);
    showToast('Ürün sepete eklendi', 'success');
    updateCartCount();
  } catch (error) {
    console.error('Add to cart error:', error);
    showToast(error.message || 'Sepete eklenirken hata oluştu', 'error');
  }
}

// Update Cart Count
async function updateCartCount() {
  if (!auth.isAuthenticated()) {
    const badge = document.getElementById('cartCount');
    if (badge) badge.textContent = '0';
    return;
  }
  
  try {
    const data = await api.getCart();
    const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartCount');
    if (badge) {
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
  } catch (error) {
    console.error('Update cart count error:', error);
  }
}

// Initialize on every page
document.addEventListener('DOMContentLoaded', async () => {
  await loadPartials();
  updateCartCount();
});