import axios from 'axios';
import jwt_decode from 'jwt-decode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'stackit_token';
const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_STORAGE_KEY || 'stackit_refresh_token';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to add auth token to requests and handle token refresh
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (!token) {
      return config;
    }
    
    try {
      // Check if token is expired
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      const isExpired = decoded.exp < currentTime;
      
      // If token is not expired, use it
      if (!isExpired) {
        config.headers['Authorization'] = `Bearer ${token}`;
        return config;
      }
      
      // If token is expired but we have a refresh token, try to get a new token
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          localStorage.setItem(TOKEN_KEY, response.data.token);
          localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
          config.headers['Authorization'] = `Bearer ${response.data.token}`;
        } catch (error) {
          // If refresh failed, clear tokens
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          
          // Redirect to login if it's not already a login/register request
          if (!config.url.includes('/auth/login') && !config.url.includes('/auth/register')) {
            window.location.href = '/login';
          }
        }
      } else {
        // No refresh token available
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (err) {
      // Invalid token format
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  getCurrentUser: () => api.get('/auth/me'),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
};

// Question services
export const questionService = {
  createQuestion: (questionData) => api.post('/questions', questionData),
  getQuestions: (params) => api.get('/questions', { params }),
  getQuestion: (id) => api.get(`/questions/${id}`),
  updateQuestion: (id, questionData) => api.put(`/questions/${id}`, questionData),
  deleteQuestion: (id) => api.delete(`/questions/${id}`),
  voteQuestion: (id, voteType) => api.post(`/questions/${id}/vote`, { voteType }),
  bookmarkQuestion: (id) => {
    // Check authentication before making the request
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return Promise.reject({ message: 'Authentication required' });
    }
    
    return api.post(`/questions/${id}/bookmark`);
  },
};

// Answer services
export const answerService = {
  createAnswer: (questionId, content) => {
    // Validate content
    if (!content || typeof content !== 'string') {
      return Promise.reject({ message: 'Answer content is required' });
    }
    
    const sanitizedContent = content.trim();
    
    // Check minimum length requirement
    if (sanitizedContent.length < 20) {
      return Promise.reject({ message: 'Answer must be at least 20 characters long' });
    }
    
    // Check authentication before making the request
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return Promise.reject({ message: 'Authentication required' });
    }
    
    return api.post(`/answers/question/${questionId}`, { content: sanitizedContent });
  },
  getAnswers: (questionId, params) => api.get(`/answers/question/${questionId}`, { params }),
  updateAnswer: (id, content) => api.put(`/answers/${id}`, { content }),
  deleteAnswer: (id) => api.delete(`/answers/${id}`),
  acceptAnswer: (id) => api.post(`/answers/${id}/accept`),
  voteAnswer: (id, voteType) => api.post(`/answers/${id}/vote`, { voteType }),
  addComment: (id, content) => api.post(`/answers/${id}/comment`, { content }),
};

// Tag services
export const tagService = {
  getTags: (params) => api.get('/tags', { params }),
  getTag: (name) => api.get(`/tags/${name}`),
  followTag: (id) => api.post(`/tags/${id}/follow`),
};

// User services
export const userService = {
  getUserByUsername: (username) => api.get(`/users/${username}`),
  updateProfile: (userData) => api.put('/users/profile', userData),
  followUser: (id) => api.post(`/users/${id}/follow`),
  getUserQuestions: (username) => api.get(`/users/${username}/questions`),
  getUserAnswers: (username) => api.get(`/users/${username}/answers`),
  getUserBookmarks: (username) => api.get(`/users/${username}/bookmarks`),
};

// Notification services
export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// AI services
export const aiService = {
  generateDescription: (data) => api.post('/ai/draft', data),
};

export default api;
