// Create a new file to centralize API URLs
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-app-name.onrender.com' 
  : 'http://localhost:5001';

export default API_BASE_URL; 