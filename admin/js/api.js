// API Client

class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = auth.getToken();
    
    const config = {
      method: options.method || 'GET',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };
    
    // Only add Content-Type for JSON, not for FormData
    if (options.body && !(options.body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(options.body);
    }
    
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Bir hata oluştu');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  // Auth methods
  async login(email, password) {
    const data = await this.request(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: { email, password }
    });
    
    if (data.token) {
      auth.setToken(data.token);
      auth.setUser(data.user);
    }
    
    return data;
  }
  
  async register(userData) {
    const data = await this.request(API_CONFIG.ENDPOINTS.REGISTER, {
      method: 'POST',
      body: userData
    });
    
    if (data.token) {
      auth.setToken(data.token);
      auth.setUser(data.user);
    }
    
    return data;
  }
  
  async verifyToken() {
    try {
      const data = await this.request(API_CONFIG.ENDPOINTS.VERIFY);
      auth.setUser(data.user);
      return data;
    } catch (error) {
      auth.logout();
      throw error;
    }
  }
  
  // Product methods
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString 
      ? `${API_CONFIG.ENDPOINTS.PRODUCTS}?${queryString}` 
      : API_CONFIG.ENDPOINTS.PRODUCTS;
    
    return await this.request(endpoint);
  }
  
  async getProduct(id) {
    return await this.request(API_CONFIG.ENDPOINTS.PRODUCT_BY_ID(id));
  }
  
  async createProduct(productData) {
    return await this.request(API_CONFIG.ENDPOINTS.PRODUCTS, {
      method: 'POST',
      body: productData
    });
  }
  
  async updateProduct(id, productData) {
    return await this.request(API_CONFIG.ENDPOINTS.PRODUCT_BY_ID(id), {
      method: 'PUT',
      body: productData
    });
  }
  
  async deleteProduct(id) {
    return await this.request(API_CONFIG.ENDPOINTS.PRODUCT_BY_ID(id), {
      method: 'DELETE'
    });
  }
  
  // Upload methods
  async uploadImage(formData) {
    return await this.request('/upload/image', {
      method: 'POST',
      body: formData
    });
  }
  
  async addImageToProduct(productId, imageData) {
    return await this.request(`/upload/product/${productId}/image`, {
      method: 'POST',
      body: imageData
    });
  }
  
  async deleteProductImage(imageId) {
    return await this.request(`/upload/product-image/${imageId}`, {
      method: 'DELETE'
    });
  }
  
  async updateProductImagePrimary(imageId, isPrimary) {
    return await this.request(`/upload/product-image/${imageId}/primary`, {
      method: 'PUT',
      body: { is_primary: isPrimary }
    });
  }
  
  // Category methods
  async getCategories() {
    return await this.request(API_CONFIG.ENDPOINTS.CATEGORIES);
  }
  
  async getCategory(slug) {
    return await this.request(API_CONFIG.ENDPOINTS.CATEGORY_BY_SLUG(slug));
  }
  
  // Cart methods
  async getCart() {
    return await this.request(API_CONFIG.ENDPOINTS.CART);
  }
  
  async addToCart(productId, quantity = 1) {
    return await this.request(API_CONFIG.ENDPOINTS.CART, {
      method: 'POST',
      body: { product_id: productId, quantity }
    });
  }
  
  async updateCartItem(productId, quantity) {
    return await this.request(API_CONFIG.ENDPOINTS.CART_ITEM(productId), {
      method: 'PUT',
      body: { quantity }
    });
  }
  
  async removeFromCart(productId) {
    return await this.request(API_CONFIG.ENDPOINTS.CART_ITEM(productId), {
      method: 'DELETE'
    });
  }
  
  // Order methods
  async createOrder(orderData) {
    return await this.request(API_CONFIG.ENDPOINTS.ORDERS, {
      method: 'POST',
      body: orderData
    });
  }
  
  async getMyOrders() {
    return await this.request(API_CONFIG.ENDPOINTS.MY_ORDERS);
  }
  
  async getOrder(id) {
    return await this.request(API_CONFIG.ENDPOINTS.ORDER_BY_ID(id));
  }
  
  async getAdminOrder(id) {
    return await this.request(API_CONFIG.ENDPOINTS.ADMIN_ORDER_BY_ID(id));
  }
  
  // Admin methods
  async getAllOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString 
      ? `${API_CONFIG.ENDPOINTS.ALL_ORDERS}?${queryString}` 
      : API_CONFIG.ENDPOINTS.ALL_ORDERS;
    
    return await this.request(endpoint);
  }
  
  async updateOrderStatus(orderId, status) {
    return await this.request(API_CONFIG.ENDPOINTS.ORDER_STATUS(orderId), {
      method: 'PUT',
      body: { status }
    });
  }
  
  async getAdminStats() {
    return await this.request(API_CONFIG.ENDPOINTS.ADMIN_STATS);
  }
  
  async getAllUsers() {
    return await this.request(API_CONFIG.ENDPOINTS.ALL_USERS);
  }
  
  // Favorites methods
  async getFavorites() {
    return await this.request(API_CONFIG.ENDPOINTS.FAVORITES);
  }
  
  async addToFavorites(productId) {
    return await this.request(API_CONFIG.ENDPOINTS.FAVORITE_TOGGLE(productId), {
      method: 'POST'
    });
  }
  
  async removeFromFavorites(productId) {
    return await this.request(API_CONFIG.ENDPOINTS.FAVORITE_TOGGLE(productId), {
      method: 'DELETE'
    });
  }
  
  // Review methods
  async getProductReviews(productId) {
    return await this.request(API_CONFIG.ENDPOINTS.PRODUCT_REVIEWS(productId));
  }
  
  async createReview(reviewData) {
    return await this.request(API_CONFIG.ENDPOINTS.REVIEWS, {
      method: 'POST',
      body: reviewData
    });
  }
  
  // User methods
  async getProfile() {
    return await this.request(API_CONFIG.ENDPOINTS.PROFILE);
  }
  
  async updateProfile(userData) {
    return await this.request(API_CONFIG.ENDPOINTS.PROFILE, {
      method: 'PUT',
      body: userData
    });
  }
}

// Create global API instance
const api = new APIClient(API_CONFIG.BASE_URL);
