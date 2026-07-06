import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const authData = localStorage.getItem('food-palace-auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        const token = parsed?.state?.token;
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    return Promise.reject(err);
  }
);

export default api;

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
};

export const productsApi = {
  getAll: (params?: any) => api.get('/products', { params }),
  getOne: (slug: string) => api.get(`/products/${slug}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  toggleStock: (id: string, inStock: boolean) => api.patch(`/products/${id}/stock`, { inStock }),
  addVariant: (id: string, data: any) => api.post(`/products/${id}/variants`, data),
  updateVariant: (id: string, data: any) => api.put(`/products/variants/${id}`, data),
  deleteVariant: (id: string) => api.delete(`/products/variants/${id}`),
  addAddon: (id: string, data: any) => api.post(`/products/${id}/addons`, data),
  getFavorites: () => api.get('/products/favorites/mine'),
  toggleFavorite: (id: string) => api.post(`/products/${id}/favorite`),
};

export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getAllAdmin: () => api.get('/categories/all'),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const ordersApi = {
  place: (data: any) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my'),
  getOne: (id: string) => api.get(`/orders/${id}`),
  markPaymentMade: (id: string) => api.patch(`/orders/${id}/payment-made`),
  cancel: (id: string) => api.patch(`/orders/${id}/cancel`),
  getAll: (params?: any) => api.get('/orders', { params }),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
  updatePayment: (id: string, data: any) => api.patch(`/orders/${id}/payment`, data),
};

export const deliveryApi = {
  getZones: () => api.get('/delivery/zones'),
  createZone: (data: any) => api.post('/delivery/zones', data),
  updateZone: (id: string, data: any) => api.put(`/delivery/zones/${id}`, data),
  deleteZone: (id: string) => api.delete(`/delivery/zones/${id}`),
  addArea: (zoneId: string, name: string) => api.post(`/delivery/zones/${zoneId}/areas`, { name }),
  deleteArea: (id: string) => api.delete(`/delivery/areas/${id}`),
};

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  toggleUser: (id: string) => api.patch(`/admin/users/${id}/toggle`),
  getNotifications: () => api.get('/admin/notifications'),
  markNotificationRead: (id: string) => api.patch(`/admin/notifications/${id}/read`),
  markAllRead: () => api.patch('/admin/notifications/read-all'),
};

export const userApi = {
  getNotifications: () => api.get('/users/notifications'),
  markRead: (id: string) => api.patch(`/users/notifications/${id}/read`),
  getAddresses: () => api.get('/users/addresses'),
  addAddress: (data: any) => api.post('/users/addresses', data),
  deleteAddress: (id: string) => api.delete(`/users/addresses/${id}`),
};

export const uploadApi = {
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const contentApi = {
  get: () => api.get('/content'),
  update: (data: any) => api.put('/content', data),
};

export const adminAccountApi = {
  update: (data: any) => api.put('/admin/account', data),
};

export const orderHistoryApi = {
  getAll: (params?: any) => api.get('/admin/order-history', { params }),
};

export const customersApi = {
  getAll: (params?: any) => api.get('/admin/customers', { params }),
  toggle: (id: string) => api.patch(`/admin/users/${id}/toggle`),
};

export const maintenanceApi = {
  getHealth: () => api.get('/admin/system-health'),
  clearTestOrders: () => api.delete('/admin/maintenance/clear-test-orders'),
  clearNotifications: () => api.delete('/admin/maintenance/clear-notifications'),
};
