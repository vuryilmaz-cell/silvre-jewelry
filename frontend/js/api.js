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
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };
    
  // Don't double-stringify
if (options.body) {
  if (typeof options.body === 'string') {
    config.body = options.body;
  } else if (config.headers['Content-Type'] === 'application/json') {
    config.body = JSON.stringify(options.body);
  }
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
      body: { product_id: productId, quantity }  // ← Zaten obje, stringify edilecek
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
    return await this.request('/orders', {
      method: 'POST',
      body: orderData
    });
  }
  
  async getMyOrders() {
    return await this.request('/orders/my-orders');
  }
  
  async getOrder(orderId) {
    return await this.request(`/orders/${orderId}`);
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

  async changePassword(currentPassword, newPassword) {
    return await this.request('/users/password', {
      method: 'PUT',
      body: {
        current_password: currentPassword,
        new_password: newPassword
      }
    });
  }

  // Address methods
  async getAddresses() {
    return await this.request('/addresses');
  }

  async getAddress(addressId) {
    return await this.request(`/addresses/${addressId}`);
  }

  async createAddress(addressData) {
    return await this.request('/addresses', {
      method: 'POST',
      body: addressData
    });
  }

  async updateAddress(addressId, addressData) {
    return await this.request(`/addresses/${addressId}`, {
      method: 'PUT',
      body: addressData
    });
  }

  async deleteAddress(addressId) {
    return await this.request(`/addresses/${addressId}`, {
      method: 'DELETE'
    });
  }

  async setDefaultAddress(addressId) {
    return await this.request(`/addresses/${addressId}/set-default`, {
      method: 'POST'
    });
  }
}

// Create global API instance
const api = new APIClient(API_CONFIG.BASE_URL);