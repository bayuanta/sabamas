import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if error is 401 Unauthorized
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || ''

      // IMPORTANT: Do NOT redirect or clear token if the 401 comes from an auth endpoint (login/register)
      // This means the user simply typed the wrong password, not that their session is invalid.
      if (requestUrl.includes('/auth/') || requestUrl.includes('login')) {
        return Promise.reject(error)
      }

      // Check if on public pages to prevent redirect
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
      const isOnPublicPage = currentPath === '/' || currentPath === '/login' || currentPath === '/portal-login'

      if (isOnPublicPage) {
        return Promise.reject(error)
      }

      // For other endpoints, 401 means the token is invalid/expired

      const user = localStorage.getItem('user')
      let userType = 'admin'

      try {
        if (user) {
          const parsedUser = JSON.parse(user)
          userType = parsedUser.role || parsedUser.type || 'admin'
        }
      } catch (e) {
        // If parsing fails, default to admin
      }

      // Only clear token for non-auth endpoints
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Redirect based on user type
      // Redirect based on user type and current path
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/portal-login') && !window.location.pathname.includes('/m-login')) {
        // Mobile Admin Redirect
        if (window.location.pathname.startsWith('/m')) {
          window.location.href = '/m-login'
        }
        // Portal Customer Redirect
        else if (userType === 'customer' || userType === 'pelanggan') {
          window.location.href = '/portal-login'
        }
        // Desktop Admin Redirect
        else {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  // Customer login menggunakan instance terpisah tanpa redirect interceptor
  customerLogin: (identifier: string, login_key: string) => {
    // Buat instance axios terpisah untuk customer login
    const customerApi = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return customerApi.post('/auth/customer-login', { identifier, login_key })
  },
}

// Users API
export const usersApi = {
  getAll: () => api.get('/users'),
  getOne: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/users/change-password', data),
}

// Customers API
export const customersApi = {
  getAll: (params?: any) => api.get('/customers', { params }),
  getOne: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.patch(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  getWilayahList: () => api.get('/customers/wilayah/list'),
  createWilayah: (nama: string) => api.post('/customers/wilayah', { nama }),
  updateWilayah: (oldName: string, newName: string) => api.patch(`/customers/wilayah/${encodeURIComponent(oldName)}`, { newName }),
  deleteWilayah: (nama: string) => api.delete(`/customers/wilayah/${encodeURIComponent(nama)}`),
  toggleStatus: (id: string, status: 'aktif' | 'nonaktif', keterangan?: string) =>
    api.patch(`/customers/${id}/toggle-status`, { status, keterangan }),
  getStatusHistory: (id: string) => api.get(`/customers/${id}/status-history`),
}

// Tariffs API
export const tariffsApi = {
  getCategories: () => api.get('/tariffs/categories'),
  getCategory: (id: string) => api.get(`/tariffs/categories/${id}`),
  createCategory: (data: any) => api.post('/tariffs/categories', data),
  updateCategory: (id: string, data: any) => api.patch(`/tariffs/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/tariffs/categories/${id}`),

  createOverride: (data: any) => api.post('/tariffs/overrides', data),
  getCustomerOverrides: (customerId: string) => api.get(`/tariffs/overrides/customer/${customerId}`),
  deleteOverride: (id: string) => api.delete(`/tariffs/overrides/${id}`),
  bulkUpdateCustomerTariff: (data: {
    customer_ids: string[];
    tarif_id: string;
    tanggal_efektif: string;
  }) => api.post('/tariffs/bulk-update', data),
}

// Payments API
export const paymentsApi = {
  getAll: (params?: any) => api.get('/payments', { params }),
  getOne: (id: string) => api.get(`/payments/${id}`),
  create: (data: any) => api.post('/payments', data),
  cancel: (id: string) => api.delete(`/payments/${id}`),
  getUndeposited: () => api.get('/payments/undeposited'),

  // Partial Payments (Cicilan)
  getPartialPayments: (customerId: string) => api.get(`/payments/partial/${customerId}`),
  getPartialPaymentDetail: (customerId: string, bulanTagihan: string) =>
    api.get(`/payments/partial/${customerId}/${bulanTagihan}`),
}

// Deposits API
export const depositsApi = {
  getAll: () => api.get('/deposits'),
  getOne: (id: string) => api.get(`/deposits/${id}`),
  create: (data: any) => api.post('/deposits', data),
  cancel: (id: string) => api.delete(`/deposits/${id}`),
}

// Reports API
export const reportsApi = {
  getDashboard: (year?: number, revenueYear?: number) => api.get('/reports/dashboard', { params: { year, revenueYear } }),
  getPayments: (params?: any) => api.get('/reports/payments', { params }),
  getArrears: (params?: any) => api.get('/reports/arrears', { params }),
}

// Settings API
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
  uploadLogo: (file: File) => {
    const formData = new FormData()
    formData.append('logo', file)
    return api.put('/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

// Rosok API
export const rosokApi = {
  getAll: () => api.get('/rosok'),
  getOne: (id: string) => api.get(`/rosok/${id}`),
  create: (data: any) => api.post('/rosok', data),
  update: (id: string, data: any) => api.patch(`/rosok/${id}`, data),
  delete: (id: string) => api.delete(`/rosok/${id}`),
}
