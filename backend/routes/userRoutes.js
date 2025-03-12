const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleAuth');
const restaurantFilter = require('../middleware/restaurantFilter');
const bcrypt = require('bcrypt');

// Apply auth to all routes
router.use(auth);
router.use(isAdmin);

// Special route for superadmins to get all users across all restaurants
router.get('/all', auth, async (req, res) => {
  try {
    // Verify the user is a superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied: Superadmin privileges required' });
    }

    console.log('Superadmin requested all users across all restaurants');
    
    // No restaurant filter for superadmins in this route
    const users = await User.find({})
      .select('-password')
      .sort({ name: 1 });
    
    console.log(`Found ${users.length} users across all restaurants`);
    res.json(users);
  } catch (err) {
    console.error('Error getting all users:', err);
    res.status(500).json({ message: err.message });
  }
});

// Apply restaurant filter to all other routes
router.use(restaurantFilter);

// Get all users for the current restaurant
router.get('/', async (req, res) => {
  try {
    let query = {};
    console.log('GET /users - User role:', req.user?.role);
    console.log('GET /users - Restaurant ID:', req.restaurantId);
    console.log('GET /users - Query params:', req.query);
    console.log('GET /users - Headers:', req.headers['x-restaurant-id']);

    // If the user is a superadmin
    if (req.user.role === 'superadmin') {
      // If a specific restaurant is requested via query param
      if (req.query.restaurantId) {
        query.restaurantId = req.query.restaurantId;
        console.log('Superadmin filtering users by restaurantId from query:', req.query.restaurantId);
      } 
      // If restaurant is specified in headers
      else if (req.headers['x-restaurant-id']) {
        query.restaurantId = req.headers['x-restaurant-id'];
        console.log('Superadmin filtering users by restaurantId from header:', req.headers['x-restaurant-id']);
      }
      // If restaurant is specified in the middleware
      else if (req.restaurantId) {
        query.restaurantId = req.restaurantId;
        console.log('Superadmin filtering users by restaurantId from middleware:', req.restaurantId);
      }
      // If no restaurant specified, return all users
      else {
        console.log('Superadmin fetching all users (no restaurant filter)');
      }
    } else {
      // Regular users only see users from their restaurant
      query.restaurantId = req.restaurantId;
      console.log('Regular admin filtering users by their restaurant:', req.restaurantId);
    }

    console.log('Final user query:', query);
    const users = await User.find(query)
      .select('-password')
      .sort({ name: 1 });
    
    console.log(`Found ${users.length} users matching the query`);
    res.json(users);
  } catch (err) {
    console.error('Error getting users:', err);
    res.status(500).json({ message: err.message });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, restaurantId } = req.body;
    
    console.log("Creating user with data:", { name, email, role, restaurantId });
    console.log("Request user:", { id: req.user.id, role: req.user.role, restaurantId: req.user.restaurantId });
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Utente già esistente con questa email' });
    }
    
    // For superadmin, use the provided restaurantId
    // For regular admin, enforce their own restaurantId
    let userRestaurantId = restaurantId;
    if (req.user.role !== 'superadmin') {
      userRestaurantId = req.user.restaurantId;
    }
    
    if (!userRestaurantId) {
      return res.status(400).json({ message: 'ID ristorante mancante' });
    }
    
    console.log("Final restaurantId to use:", userRestaurantId);
    
    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role || 'kitchen',
      restaurantId: userRestaurantId
    });
    
    await user.save();
    
    res.status(201).json({
      message: 'Utente creato con successo',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update user status
router.patch('/:id', async (req, res) => {
  try {
    const { active } = req.body;
    
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId },
      { active },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a user's details
router.put('/:id', async (req, res) => {
  try {
    const { name, email, password, role, active } = req.body;
    const userId = req.params.id;
    
    // Check if a user with this email already exists (and it's not the same user)
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email già in uso da un altro utente' });
      }
    }
    
    // Prepare update object
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (typeof active !== 'undefined') updateData.active = active;
    
    // If password is provided, hash it
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    
    // Set query conditions - superadmins can update any user
    let query = { _id: userId };
    if (req.user.role !== 'superadmin') {
      // Regular admins can only update users in their restaurant
      query.restaurantId = req.restaurantId;
    }
    
    // Do not allow changing superadmin status unless you are a superadmin
    const userToUpdate = await User.findById(userId);
    if (userToUpdate.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Non puoi modificare un Super Admin' });
    }
    
    // Update user
    const user = await User.findOneAndUpdate(
      query,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato o non hai permessi per modificarlo' });
    }
    
    res.json({
      message: 'Utente aggiornato con successo',
      user
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 