import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/axios';

const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  accessToken: null,
  signup: async () => {},
  login: async () => {},
  logout: () => {},
  refreshAccessToken: async () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (storedAccessToken && storedUser) {
      try {
        setAccessToken(storedAccessToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('[Auth Context] Failed to parse stored user:', error);
        // Clear invalid data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }

    setIsLoading(false);
  }, []);

  /**
   * Sign up a new user
   */
  const signup = async (email, password) => {
    try {
      const response = await api.post('/api/auth/signup', { email, password });
      const { user: newUser, accessToken: token, refreshToken } = response.data;

      // Store tokens and user in localStorage
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      // Update state
      setUser(newUser);
      setAccessToken(token);
      setIsAuthenticated(true);

      return { success: true, user: newUser };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Signup failed';
      console.error('[Auth Context] Signup failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Login user
   */
  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { user: loggedInUser, accessToken: token, refreshToken } = response.data;

      // Store tokens and user in localStorage
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(loggedInUser));

      // Update state
      setUser(loggedInUser);
      setAccessToken(token);
      setIsAuthenticated(true);

      return { success: true, user: loggedInUser };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      console.error('[Auth Context] Login failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        // Call logout endpoint to invalidate refresh token
        await api.post('/api/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('[Auth Context] Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Clear state
      setUser(null);
      setAccessToken(null);
      setIsAuthenticated(false);
    }
  };

  /**
   * Refresh access token
   */
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/api/auth/refresh', { refreshToken });
      const { accessToken: newToken, refreshToken: newRefreshToken } = response.data;

      // Update tokens in localStorage
      localStorage.setItem('accessToken', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      // Update state
      setAccessToken(newToken);

      return { success: true };
    } catch (error) {
      console.error('[Auth Context] Token refresh failed:', error);
      // Clear auth state on refresh failure
      logout();
      return { success: false };
    }
  };

  const contextValue = {
    isAuthenticated,
    user,
    accessToken,
    isLoading,
    signup,
    login,
    logout,
    refreshAccessToken
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
