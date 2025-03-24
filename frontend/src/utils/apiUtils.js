import axios from 'axios';
import API_BASE_URL from '../api/index';

// Enhanced API call function that handles authentication and restaurant context
export const apiCall = async (endpoint, method = 'get', data = null) => {
  // Get the authentication token
  const token = localStorage.getItem('token');
  if (!token) {
    console.error("No auth token available for API request");
    throw new Error("Authentication required");
  }

  // Get the user information
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  
  // Set up headers with authentication token
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  // Set up config object with headers
  const config = { headers };
  
  // Add restaurant context for superadmin
  if (user?.role === 'superadmin') {
    // Get the selected restaurant from localStorage
    const selectedRestaurant = localStorage.getItem('selectedRestaurant');
    
    if (selectedRestaurant) {
      console.log(`Superadmin API call with restaurant: ${selectedRestaurant}`);
      
      // Always add restaurant ID to headers for consistent handling
      config.headers['X-Restaurant-ID'] = selectedRestaurant;
      
      // Add to query params for GET requests
      if (method.toLowerCase() === 'get') {
        config.params = { ...(config.params || {}), restaurantId: selectedRestaurant };
      }
      
      // Add to body for non-GET requests if body exists
      if (data && method.toLowerCase() !== 'get') {
        data = { ...data, restaurantId: selectedRestaurant };
      }
      // For DELETE without body, create one with restaurantId
      else if (!data && method.toLowerCase() === 'delete') {
        data = { restaurantId: selectedRestaurant };
      }
    } else {
      console.warn('Superadmin API call without selected restaurant');
    }
  }
  
  // Debug info
  console.log(`API ${method.toUpperCase()} request to ${endpoint}`);
  console.log('Headers:', JSON.stringify(config.headers));
  if (config.params) console.log('Query params:', config.params);
  if (data) console.log('Request data:', data);
  
  // Fix for double /api prefix - if endpoint starts with /api, remove it
  const fixedEndpoint = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
  
  // Make the API call with the correct configuration
  try {
    let response;
    
    switch (method.toLowerCase()) {
      case 'get':
        response = await axios.get(`${API_BASE_URL}${fixedEndpoint}`, config);
        break;
      case 'post':
        response = await axios.post(`${API_BASE_URL}${fixedEndpoint}`, data, config);
        break;
      case 'put':
        response = await axios.put(`${API_BASE_URL}${fixedEndpoint}`, data, config);
        break;
      case 'delete':
        // Simplified DELETE request - don't send body data for delete requests
        if (user?.role === 'superadmin' && config.headers['X-Restaurant-ID']) {
          // For superadmin, we'll use query params instead of body for DELETE
          config.params = { 
            ...(config.params || {}), 
            restaurantId: config.headers['X-Restaurant-ID'] 
          };
        }
        response = await axios.delete(`${API_BASE_URL}${fixedEndpoint}`, config);
        break;
      case 'patch':
        response = await axios.patch(`${API_BASE_URL}${fixedEndpoint}`, data, config);
        break;
      default:
        response = await axios.get(`${API_BASE_URL}${fixedEndpoint}`, config);
    }
    
    // Log response summary
    console.log(`Response from ${endpoint}: Status ${response.status}`, 
      Array.isArray(response.data) 
        ? `${response.data.length} items` 
        : 'Data received');
    
    return response;
  } catch (error) {
    console.error(`API error (${method} ${endpoint}):`, error);
    
    // If unauthorized, clear token and redirect to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    throw error;
  }
};

// Legacy function for backward compatibility
export const apiRequest = async (endpoint, method = 'get', data = null) => {
  return apiCall(endpoint, method, data);
}; 