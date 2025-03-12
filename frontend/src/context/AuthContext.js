import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/index';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if user is logged in on page load
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Set auth token header
        axios.defaults.headers.common['x-auth-token'] = token;
        
        const res = await axios.get(`${API_BASE_URL}/api/auth/user`);
        
        setUser(res.data);
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (err) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['x-auth-token'];
        setIsAuthenticated(false);
        setUser(null);
        setError(err.response?.data?.message || 'Authentication error');
        setIsLoading(false);
      }
    };
    
    checkLoggedIn();
  }, []);
  
  // Login
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      
      setUser(res.data.user);
      setIsAuthenticated(true);
      setError(null);
      
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return false;
    }
  };
  
  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
    setIsAuthenticated(false);
    setUser(null);
  };
  
  // Add console logging to debug authentication issues
  useEffect(() => {
    console.log("Authentication state:", { 
      isAuthenticated, 
      user, 
      isLoading 
    });
  }, [isAuthenticated, user, isLoading]);
  
  // Add this to your AuthContext.js where you decode the token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode token without verification (just to see what's in it)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        console.log("Token payload:", JSON.parse(jsonPayload));
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    }
  }, []);
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 