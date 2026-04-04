// Home Page JavaScript

document.addEventListener('DOMContentLoaded', async () => {
  await loadFeaturedProducts();
  await loadCategories();
});

// Load featured products
async function loadFeaturedProducts() {
  const container = document.getElementById('featuredProducts');
  if (!container) return;
  
  try {
    const data = await api.getProducts({ 
      featured: 'true', 
      limit: APP_CONFIG.FEATURED_PRODUCTS_LIMIT 
    });
    
    if (data.products && data.products.length > 0) {
      container.innerHTML = data.products.map(product => renderProductCard(product)).join('');
    } else {
      container.innerHTML = '<p class="no-products">Henüz öne çıkan ürün bulunmuyor.</p>';
    }
  } catch (error) {
    console.error('Load featured products error:', error);
    container.innerHTML = '<p class="error-message">Ürünler yüklenirken hata oluştu.</p>';
  }
}

// Load categories
async function loadCategories() {
  const container = document.getElementById('categoriesGrid');
  if (!container) return;
  
  try {
    const data = await api.getCategories();
    
    if (data.categories && data.categories.length > 0) {
      container.innerHTML = data.categories.map(category => renderCategoryCard(category)).join('');
    } else {
      container.innerHTML = '<p class="no-categories">Henüz kategori bulunmuyor.</p>';
    }
  } catch (error) {
    console.error('Load categories error:', error);
    container.innerHTML = '<p class="error-message">Kategoriler yüklenirken hata oluştu.</p>';
  }
}


// Scroll animation for hero
window.addEventListener('scroll', () => {
  const hero = document.querySelector('.hero');
  if (window.scrollY > 100) {
    hero.classList.add('scrolled');
  } else {
    hero.classList.remove('scrolled');
  }
});