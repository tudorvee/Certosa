// Restaurant filter middleware
module.exports = (req, res, next) => {
  console.log("Restaurant filter middleware running");
  console.log(`User: ${req.user ? `ID: ${req.user.id}, Role: ${req.user.role}` : 'No user'}`);
  
  // Debug information
  console.log("Headers:", req.headers);
  console.log("Query params:", req.query);
  console.log("Request body:", req.body ? "Present" : "Not present");
  
  // Clear any existing restaurantId from previous middleware runs
  delete req.restaurantId;
  
  // Check for restaurant ID in headers (case insensitive)
  const headerKeys = Object.keys(req.headers).map(k => k.toLowerCase());
  const hasRestaurantHeader = headerKeys.includes('x-restaurant-id');
  
  if (hasRestaurantHeader) {
    // Find the actual header key with original casing
    const actualHeaderKey = Object.keys(req.headers).find(
      k => k.toLowerCase() === 'x-restaurant-id'
    );
    req.restaurantId = req.headers[actualHeaderKey];
    console.log("Using restaurant ID from header:", req.restaurantId);
  }
  // If header not found, check other sources
  else if (req.user && req.user.role === 'superadmin') {
    // Priority 1: Query parameter (typically for GET requests)
    if (req.query && req.query.restaurantId) {
      req.restaurantId = req.query.restaurantId;
      console.log("Superadmin using restaurant ID from query:", req.restaurantId);
    }
    // Priority 2: Request body (typically for POST/PUT/DELETE)
    else if (req.body && req.body.restaurantId) {
      req.restaurantId = req.body.restaurantId;
      console.log("Superadmin using restaurant ID from body:", req.restaurantId);
    }
    // Priority 3: User's default restaurant
    else if (req.user.restaurantId) {
      req.restaurantId = req.user.restaurantId;
      console.log("Superadmin using default restaurant ID:", req.restaurantId);
    }
  }
  // For regular users (admin or kitchen), always use their assigned restaurant
  else if (req.user) {
    if (req.user.restaurantId) {
      req.restaurantId = req.user.restaurantId;
      console.log("Regular user using their restaurant ID:", req.restaurantId);
    } else {
      console.error("User has no restaurant ID assigned:", req.user.id);
    }
  }

  // Final validation
  if (!req.restaurantId) {
    console.warn("WARNING: No restaurant ID set in middleware");
  } else {
    console.log("Final restaurant ID set to:", req.restaurantId);
  }
  
  next();
}; 