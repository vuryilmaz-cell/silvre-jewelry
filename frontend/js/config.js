// API Configuration
const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api',
  UPLOADS_URL: 'http://localhost:5000', // Görseller için base URL

  TIMEOUT: 10000,
  
  // Endpoints
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY: '/auth/verify',
    
    // Products
    PRODUCTS: '/products',
    PRODUCT_BY_ID: (id) => `/products/${id}`,
    
    // Categories
    CATEGORIES: '/categories',
    CATEGORY_BY_SLUG: (slug) => `/categories/${slug}`,
    
    // Cart
    CART: '/cart',
    CART_ITEM: (productId) => `/cart/${productId}`,
    
    // Orders
    ORDERS: '/orders',
    MY_ORDERS: '/orders/my-orders',
    ORDER_BY_ID: (id) => `/orders/${id}`,
    
    // Favorites
    FAVORITES: '/favorites',
    FAVORITE_TOGGLE: (productId) => `/favorites/${productId}`,
    
    // Reviews
    REVIEWS: '/reviews',
    PRODUCT_REVIEWS: (productId) => `/reviews/product/${productId}`,
    
    // User
    PROFILE: '/users/profile'
  }
};

// Local Storage Keys
const STORAGE_KEYS = {
  TOKEN: 'silvre_auth_token',
  USER: 'silvre_user',
  CART: 'silvre_cart',
  FAVORITES: 'silvre_favorites'
};

// App Settings
const APP_CONFIG = {
  CURRENCY: 'TRY',
  CURRENCY_SYMBOL: '₺',
  FREE_SHIPPING_THRESHOLD: 500,
  SHIPPING_COST: 30,
  PRODUCTS_PER_PAGE: 20,
  FEATURED_PRODUCTS_LIMIT: 100
};
