// Utility Functions

// Format price
function formatPrice(price) {
  return `${price.toFixed(2)} ${APP_CONFIG.CURRENCY_SYMBOL}`;
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Slugify text
function slugify(text) {
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
}

// Show toast notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Show/hide loading overlay
function showLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.add('active');
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.remove('active');
}

// Get query parameter
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Update query parameter
function updateQueryParam(param, value) {
  const url = new URL(window.location);
  if (value) {
    url.searchParams.set(param, value);
  } else {
    url.searchParams.delete(param);
  }
  window.history.pushState({}, '', url);
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Local Storage helpers
const storage = {
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },
  
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }
};

// Auth helpers
const auth = {
  getToken() {
    return storage.get(STORAGE_KEYS.TOKEN);
  },
  
  setToken(token) {
    return storage.set(STORAGE_KEYS.TOKEN, token);
  },
  
  removeToken() {
    return storage.remove(STORAGE_KEYS.TOKEN);
  },
  
  getUser() {
    return storage.get(STORAGE_KEYS.USER);
  },
  
  setUser(user) {
    return storage.set(STORAGE_KEYS.USER, user);
  },
  
  isAuthenticated() {
    return !!this.getToken();
  },
  
  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },
  
  logout() {
    this.removeToken();
    storage.remove(STORAGE_KEYS.USER);
    storage.remove(STORAGE_KEYS.CART);
    storage.remove(STORAGE_KEYS.FAVORITES);
    window.location.href = '/';
  }
};

// Cart helpers (localStorage backup)
const cartHelper = {
  getCart() {
    return storage.get(STORAGE_KEYS.CART) || [];
  },
  
  addToCart(product, quantity = 1) {
    const cart = this.getCart();
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        product_id: product.id,
        name: product.name,
        price: product.discount_price || product.price,
        image: product.primary_image,
        quantity
      });
    }
    
    storage.set(STORAGE_KEYS.CART, cart);
    this.updateCartCount();
    return cart;
  },
  
  removeFromCart(productId) {
    let cart = this.getCart();
    cart = cart.filter(item => item.product_id !== productId);
    storage.set(STORAGE_KEYS.CART, cart);
    this.updateCartCount();
    return cart;
  },
  
  updateQuantity(productId, quantity) {
    const cart = this.getCart();
    const item = cart.find(item => item.product_id === productId);
    
    if (item) {
      if (quantity === 0) {
        return this.removeFromCart(productId);
      }
      item.quantity = quantity;
      storage.set(STORAGE_KEYS.CART, cart);
      this.updateCartCount();
    }
    
    return cart;
  },
  
  clearCart() {
    storage.remove(STORAGE_KEYS.CART);
    this.updateCartCount();
  },
  
  getCartCount() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
  },
  
  updateCartCount() {
    const count = this.getCartCount();
    const badge = document.getElementById('cartCount');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }
};

// Favorites helpers
const favoritesHelper = {
  getFavorites() {
    return storage.get(STORAGE_KEYS.FAVORITES) || [];
  },
  
  addFavorite(productId) {
    const favorites = this.getFavorites();
    if (!favorites.includes(productId)) {
      favorites.push(productId);
      storage.set(STORAGE_KEYS.FAVORITES, favorites);
      this.updateFavoriteCount();
    }
    return favorites;
  },
  
  removeFavorite(productId) {
    let favorites = this.getFavorites();
    favorites = favorites.filter(id => id !== productId);
    storage.set(STORAGE_KEYS.FAVORITES, favorites);
    this.updateFavoriteCount();
    return favorites;
  },
  
  toggleFavorite(productId) {
    const favorites = this.getFavorites();
    if (favorites.includes(productId)) {
      return this.removeFavorite(productId);
    } else {
      return this.addFavorite(productId);
    }
  },
  
  isFavorite(productId) {
    const favorites = this.getFavorites();
    return favorites.includes(productId);
  },
  
  updateFavoriteCount() {
    const count = this.getFavorites().length;
    const badge = document.getElementById('favCount');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }
};


// Initialize counts on page load
document.addEventListener('DOMContentLoaded', () => {
  cartHelper.updateCartCount();
  favoritesHelper.updateFavoriteCount();
});
