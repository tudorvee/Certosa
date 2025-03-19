// Create a new file to centralize API URLs
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://certosa-backend.onrender.com/api' 
  : 'http://localhost:5001/api';

export default API_BASE_URL; 