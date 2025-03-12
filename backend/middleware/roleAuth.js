// Middleware to check if user has required role
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if user's role is in the allowed roles
    const hasRole = roles.includes(req.user.role);
    if (!hasRole) {
      return res.status(403).json({ message: 'Access forbidden' });
    }
    
    next();
  };
};

// Restaurant Admin can only manage their own restaurant
const isRestaurantAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  if (req.user.role === 'superadmin') {
    // Superadmin can do anything
    return next();
  }
  
  if (req.user.role === 'admin') {
    // Set the restaurant ID filter to the admin's restaurant
    req.restaurantId = req.user.restaurantId;
    return next();
  }
  
  return res.status(403).json({ message: 'Access forbidden' });
};

module.exports = {
  isSuperAdmin: checkRole(['superadmin']),
  isAdmin: checkRole(['admin', 'superadmin']),
  isKitchen: checkRole(['kitchen', 'admin', 'superadmin']),
  isRestaurantAdmin
}; 