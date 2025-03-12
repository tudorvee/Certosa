const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log("Auth middleware running");
  
  // Get token from header - support both formats
  // 1. x-auth-token header (original)
  // 2. Authorization: Bearer token (standard)
  let token = req.header('x-auth-token');
  
  // Check for Authorization header with Bearer token
  const authHeader = req.header('Authorization');
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
    console.log("Using token from Authorization header");
  }
  
  // Check if no token
  if (!token) {
    console.log("No token found in request");
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user data to request
    req.user = decoded;
    console.log("Authenticated user:", req.user.id, "Role:", req.user.role);
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 