import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api' 
  : 'https://your-production-api.com/api';

// Token management
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

const setAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem('authToken', token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

const removeAuthToken = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.data?.token) {
      await setAuthToken(response.data.token);
    }
    
    return response;
  },

  // Login with email
  login: async (email, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.data?.token) {
      await setAuthToken(response.data.token);
    }
    
    return response;
  },

  // Login with phone
  loginWithPhone: async (phone, password) => {
    const response = await apiRequest('/auth/login-phone', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
    
    if (response.data?.token) {
      await setAuthToken(response.data.token);
    }
    
    return response;
  },

  // Get current user
  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    return await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Forgot password
  forgotPassword: async (email) => {
    return await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    return await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  // Logout
  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await removeAuthToken();
    }
  },
};

// User API
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    return await apiRequest('/users/profile');
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return await apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Update health profile
  updateHealthProfile: async (healthData) => {
    return await apiRequest('/users/health-profile', {
      method: 'PUT',
      body: JSON.stringify(healthData),
    });
  },

  // Update preferences
  updatePreferences: async (preferences) => {
    return await apiRequest('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  },

  // Upload profile image
  uploadProfileImage: async (imageUri) => {
    const formData = new FormData();
    formData.append('profileImage', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    });

    return await apiRequest('/users/upload-profile-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  },

  // Get user BMI
  getBMI: async () => {
    return await apiRequest('/users/bmi');
  },

  // Delete account
  deleteAccount: async () => {
    return await apiRequest('/users/account', {
      method: 'DELETE',
    });
  },
};

// Fitness API
export const fitnessAPI = {
  // Get all workout plans
  getWorkouts: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/fitness/workouts?${queryParams}` : '/fitness/workouts';
    return await apiRequest(endpoint);
  },

  // Get single workout plan
  getWorkout: async (id) => {
    return await apiRequest(`/fitness/workouts/${id}`);
  },

  // Rate a workout plan
  rateWorkout: async (id, rating, review) => {
    return await apiRequest(`/fitness/workouts/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, review }),
    });
  },

  // Get workout categories
  getCategories: async () => {
    return await apiRequest('/fitness/categories');
  },

  // Get difficulty levels
  getDifficulties: async () => {
    return await apiRequest('/fitness/difficulties');
  },

  // Get featured workouts
  getFeatured: async () => {
    return await apiRequest('/fitness/featured');
  },

  // Get fitness statistics
  getStats: async () => {
    return await apiRequest('/fitness/stats');
  },
};

// Nutrition API
export const nutritionAPI = {
  // Get all meals
  getMeals: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/nutrition/meals?${queryParams}` : '/nutrition/meals';
    return await apiRequest(endpoint);
  },

  // Get single meal
  getMeal: async (id) => {
    return await apiRequest(`/nutrition/meals/${id}`);
  },

  // Rate a meal
  rateMeal: async (id, rating, review) => {
    return await apiRequest(`/nutrition/meals/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, review }),
    });
  },

  // Get meal categories
  getCategories: async () => {
    return await apiRequest('/nutrition/categories');
  },

  // Get meal subcategories
  getSubcategories: async () => {
    return await apiRequest('/nutrition/subcategories');
  },

  // Get featured meals
  getFeatured: async () => {
    return await apiRequest('/nutrition/featured');
  },

  // Get traditional medicine
  getTraditionalMedicine: async () => {
    return await apiRequest('/nutrition/traditional-medicine');
  },

  // Get nutrition statistics
  getStats: async () => {
    return await apiRequest('/nutrition/stats');
  },
};

// Health Personnel API
export const personnelAPI = {
  // Get all health professionals
  getProfessionals: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/personnel/professionals?${queryParams}` : '/personnel/professionals';
    return await apiRequest(endpoint);
  },

  // Get single professional
  getProfessional: async (id) => {
    return await apiRequest(`/personnel/professionals/${id}`);
  },

  // Rate a professional
  rateProfessional: async (id, rating, review) => {
    return await apiRequest(`/personnel/professionals/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, review }),
    });
  },

  // Get specialties
  getSpecialties: async () => {
    return await apiRequest('/personnel/specialties');
  },

  // Get counties
  getCounties: async () => {
    return await apiRequest('/personnel/counties');
  },

  // Get verified professionals
  getVerified: async () => {
    return await apiRequest('/personnel/verified');
  },

  // Get emergency providers
  getEmergency: async () => {
    return await apiRequest('/personnel/emergency');
  },

  // Get personnel statistics
  getStats: async () => {
    return await apiRequest('/personnel/stats');
  },
};

// Orders API
export const ordersAPI = {
  // Create new order
  createOrder: async (orderData) => {
    return await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Get user orders
  getOrders: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/orders?${queryParams}` : '/orders';
    return await apiRequest(endpoint);
  },

  // Get single order
  getOrder: async (id) => {
    return await apiRequest(`/orders/${id}`);
  },

  // Cancel order
  cancelOrder: async (id, reason) => {
    return await apiRequest(`/orders/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  // Rate order
  rateOrder: async (id, rating, review) => {
    return await apiRequest(`/orders/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, review }),
    });
  },

  // Track order
  trackOrder: async (orderNumber) => {
    return await apiRequest(`/orders/tracking/${orderNumber}`);
  },
};

// Bookings API
export const bookingsAPI = {
  // Create new booking
  createBooking: async (bookingData) => {
    return await apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  // Get user bookings
  getBookings: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/bookings?${queryParams}` : '/bookings';
    return await apiRequest(endpoint);
  },

  // Get single booking
  getBooking: async (id) => {
    return await apiRequest(`/bookings/${id}`);
  },

  // Cancel booking
  cancelBooking: async (id, reason) => {
    return await apiRequest(`/bookings/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  // Rate booking
  rateBooking: async (id, rating, review) => {
    return await apiRequest(`/bookings/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, review }),
    });
  },

  // Get upcoming bookings
  getUpcoming: async () => {
    return await apiRequest('/bookings/upcoming');
  },
};

// Utility functions
export const apiUtils = {
  // Check if user is authenticated
  isAuthenticated: async () => {
    const token = await getAuthToken();
    return !!token;
  },

  // Clear all stored data
  clearAllData: async () => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  },

  // Get stored user data
  getUserData: async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Store user data
  setUserData: async (userData) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Error setting user data:', error);
    }
  },
};

export default {
  auth: authAPI,
  user: userAPI,
  fitness: fitnessAPI,
  nutrition: nutritionAPI,
  personnel: personnelAPI,
  orders: ordersAPI,
  bookings: bookingsAPI,
  utils: apiUtils,
};
