// API service for backend communication
const API_URL = 'http://localhost:3001/api';

/**
 * Base API request with error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<any>} - API response
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  // Add default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Add auth token if it exists
  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Authentication Service
const AuthService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<any>} - API response
   */
  async register(userData) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  
  /**
   * Login user
   * @param {Object} credentials - User login credentials
   * @returns {Promise<any>} - API response with token
   */
  async login(credentials) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    // Save token to localStorage
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },
  
  /**
   * Verify email with token
   * @param {string} token - Verification token
   * @returns {Promise<any>} - API response
   */
  async verifyEmail(token) {
    return apiRequest(`/auth/verify/${token}`);
  },
  
  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  /**
   * Check if user is logged in
   * @returns {boolean} - Is user logged in
   */
  isLoggedIn() {
    return !!localStorage.getItem('token');
  },
  
  /**
   * Get current user data
   * @returns {Object|null} - User data or null
   */
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

// User Service
const UserService = {
  /**
   * Get user profile
   * @returns {Promise<any>} - API response
   */
  async getProfile() {
    return apiRequest('/users/profile');
  },
  
  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<any>} - API response
   */
  async updateProfile(profileData) {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },
  
  /**
   * Get users from the same company
   * @returns {Promise<any>} - API response
   */
  async getCompanyUsers() {
    return apiRequest('/users/company');
  }
};

// Secret Service
const SecretService = {
  /**
   * Share a secret with another user
   * @param {Object} secretData - Secret data
   * @returns {Promise<any>} - API response
   */
  async shareSecret(secretData) {
    return apiRequest('/secrets', {
      method: 'POST',
      body: JSON.stringify(secretData)
    });
  },
  
  /**
   * Get all secrets (sent or received)
   * @param {string} type - Filter type: 'all', 'sent', or 'received'
   * @returns {Promise<any>} - API response
   */
  async getSecrets(type = 'all') {
    return apiRequest(`/secrets?type=${type}`);
  },
  
  /**
   * Get a specific secret by ID
   * @param {number} secretId - Secret ID
   * @returns {Promise<any>} - API response
   */
  async getSecretById(secretId) {
    return apiRequest(`/secrets/${secretId}`);
  },
  
  /**
   * Mark a secret as read
   * @param {number} secretId - Secret ID
   * @returns {Promise<any>} - API response
   */
  async markAsRead(secretId) {
    return apiRequest(`/secrets/${secretId}/read`, {
      method: 'PUT'
    });
  }
};

export {
  AuthService,
  UserService,
  SecretService
}; 