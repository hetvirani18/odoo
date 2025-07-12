import { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';
import jwt_decode from 'jwt-decode';

const AuthContext = createContext();

// Storage keys
const TOKEN_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'stackit_token';
const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_STORAGE_KEY || 'stackit_refresh_token';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem(REFRESH_TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // Check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (err) {
      return true;
    }
  };

  // Clear authentication data
  const clearAuthData = () => {
    console.log('AuthContext: Clearing auth data');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setToken(null);
    setRefreshToken(null);
    setCurrentUser(null);
  };

  // Load user data on initial render only
  useEffect(() => {
    const loadUser = async () => {
      console.log('AuthContext: Initial load...');
      console.log('Token exists:', !!token);
      console.log('Refresh token exists:', !!refreshToken);
      
      setLoading(true);

      // If no token or refresh token, clear everything
      if (!token && !refreshToken) {
        console.log('AuthContext: No tokens found, clearing auth data');
        clearAuthData();
        setLoading(false);
        return;
      }

      // If token is expired but we have a refresh token
      if (isTokenExpired(token) && refreshToken) {
        console.log('AuthContext: Token expired, attempting refresh...');
        try {
          // Try to refresh the token
          const response = await authService.refreshToken(refreshToken);
          const { token: newToken, refreshToken: newRefreshToken } = response.data;
          
          console.log('AuthContext: Token refreshed successfully');
          
          // Update tokens
          localStorage.setItem(TOKEN_KEY, newToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
          setToken(newToken);
          setRefreshToken(newRefreshToken);
          
          // Get user data
          const userResponse = await authService.getCurrentUser();
          setCurrentUser(userResponse.data.user);
          console.log('AuthContext: User data loaded after refresh');
        } catch (error) {
          console.error('AuthContext: Token refresh failed:', error);
          clearAuthData();
        }
      } else if (token && !isTokenExpired(token)) {
        // Token is valid, get user data
        console.log('AuthContext: Token valid, fetching user data...');
        try {
          const userResponse = await authService.getCurrentUser();
          setCurrentUser(userResponse.data.user);
          console.log('AuthContext: User data loaded successfully');
        } catch (error) {
          console.error('AuthContext: Failed to get user data:', error);
          console.error('AuthContext: Error response:', error.response?.data);
          clearAuthData();
        }
      } else {
        // No valid token
        console.log('AuthContext: No valid token found, clearing auth data');
        clearAuthData();
      }

      setLoading(false);
    };

    loadUser();
  }, []); // Empty dependency array - only run once on mount

  // Login function
  const login = async (authData) => {
    try {
      const { token: newToken, refreshToken: newRefreshToken, user } = authData;
      
      // Store tokens
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      
      // Update state
      setToken(newToken);
      setRefreshToken(newRefreshToken);
      setCurrentUser(user);
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API if we have a refresh token
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local data regardless of API call success
      clearAuthData();
    }
  };

  const value = {
    currentUser,
    token,
    refreshToken,
    loading,
    login,
    logout,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
