import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://freshgrupo-server.onrender.com/api',
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication services
const getBaseURL = () => process.env.REACT_APP_API_URL || 'https://freshgrupo-server.onrender.com/api';

export const authService = {
  login: async (email, password) => {
    try {
      const response = await axios.post(
        `${getBaseURL()}/auth/admin-login`,
        { email, password }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  register: async (name, email, password, phone = '') => {
    try {
      const response = await axios.post(
        `${getBaseURL()}/auth/register`,
        { name, email, password, phone }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('adminUser');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => !!localStorage.getItem('adminToken'),
};

// Category services
export const categoryService = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/categories/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Product services
export const productService = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  getByCategory: (categoryId) => api.get(`/categories/${categoryId}/products`),
  create: (data) => api.post('/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/products/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/products/${id}`),
  updateStock: (id, stock) => api.patch(`/products/${id}/stock`, { stock }),
  updatePrice: (id, price) => api.patch(`/products/${id}/price`, { price }),
};

// User services
export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  getCustomers: () => api.get('/users?role=customer'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleStatus: (id) => api.patch(`/users/${id}/status`),
};

// Address services
export const addressService = {
  getAll: () => api.get('/addresses'),
  getById: (id) => api.get(`/addresses/${id}`),
  getByUserId: (userId) => api.get(`/addresses?userId=${userId}`),
  create: (data) => api.post('/addresses', data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  delete: (id) => api.delete(`/addresses/${id}`),
};

// Unit Type services
export const unitTypeService = {
  getAll: () => api.get('/unit-types'),
  create: (data) => api.post('/unit-types', data),
  update: (id, data) => api.put(`/unit-types/${id}`, data),
  delete: (id) => api.delete(`/unit-types/${id}`),
};

// Pack Type services
export const packTypeService = {
  getAll: () => api.get('/pack-types'),
  create: (data) => api.post('/pack-types', data),
  update: (id, data) => api.put(`/pack-types/${id}`, data),
  delete: (id) => api.delete(`/pack-types/${id}`),
};

// Pack services
export const packService = {
  getAll: () => api.get('/packs'),
  getById: (id) => api.get(`/packs/${id}`),
  getByCategory: (categoryId) => api.get(`/categories/${categoryId}/packs`),
  create: (data) => api.post('/packs', data),
  update: (id, data) => api.put(`/packs/${id}`, data),
  delete: (id) => api.delete(`/packs/${id}`),
  updatePrice: (id, price) => api.patch(`/packs/${id}/price`, { price }),
};

// Pack Product services
export const packProductService = {
  getByPackId: (packId) => api.get(`/packs/${packId}/products`),
  createBulk: (data) => api.post('/pack-products/bulk', data),
  deleteByPackId: (packId) => api.delete(`/packs/${packId}/products`),
};

// Public API services for mobile app
export const publicService = {
  getCategories: () => axios.get(`${getBaseURL()}/public/categories`),
  getProducts: () => axios.get(`${getBaseURL()}/public/products`),
  getPacks: () => axios.get(`${getBaseURL()}/public/packs`),
  getCategoryPacks: (categoryId) =>
    axios.get(`${getBaseURL()}/public/categories/${categoryId}/packs`),
};

// Delivery services
export const deliveryService = {
  getAll: () => api.get('/deliveries'),
  getById: (id) => api.get(`/deliveries/${id}`),
  assignDelivery: (orderId, deliveryPersonId) =>
    api.post(`/orders/${orderId}/assign-delivery`, { deliveryPersonId }),
  updateStatus: (id, status) =>
    api.patch(`/deliveries/${id}/status`, { status }),
};

// Cart services
export const cartService = {
  getByUserId: (userId) => api.get(`/cart/${userId}`),
  addToCart: (data) => api.post('/cart', data),
  updateCartItem: (id, data) => api.put(`/cart/${id}`, data),
  removeFromCart: (id) => api.delete(`/cart/${id}`),
};

// Order services
export const orderService = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) =>
    api.patch(`/orders/${id}/status`, { status }),
};

// Payment services
export const paymentService = {
  getAll: () => api.get('/payments'),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  createRazorpayOrder: (data) => api.post('/create-razorpay-order', data),
  verifyPayment: (data) => api.post('/verify-payment', data),
};

export default api;
