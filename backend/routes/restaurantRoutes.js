const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleAuth');
const restaurantFilter = require('../middleware/restaurantFilter');
const sendEmail = require('../utils/emailService');

// Apply auth to all routes
router.use(auth);
router.use(restaurantFilter);

// Get current restaurant - detailed error logging
router.get('/current', auth, async (req, res) => {
  try {
    console.log("Restaurant request - User:", req.user ? 
                `ID: ${req.user.id}, Role: ${req.user.role}` : 'No user');
    
    // Determine restaurant ID
    let restaurantId = null;
    
    if (req.user.role === 'superadmin' && req.query.restaurantId) {
      restaurantId = req.query.restaurantId;
      console.log("Superadmin requesting specific restaurant:", restaurantId);
    } else {
      restaurantId = req.user.restaurantId;
      console.log("User requesting their restaurant:", restaurantId);
    }
    
    if (!restaurantId) {
      console.log("ERROR: No restaurant ID available");
      return res.status(400).json({ message: 'No restaurant ID available for this user' });
    }
    
    console.log("Finding restaurant with ID:", restaurantId);
    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant) {
      console.log("ERROR: Restaurant not found with ID:", restaurantId);
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    console.log("SUCCESS: Restaurant found:", restaurant.name);
    res.json(restaurant);
  } catch (err) {
    console.error('ERROR in /restaurants/current:', err.message, err.stack);
    res.status(500).json({ message: 'Server error retrieving restaurant' });
  }
});

// Update current restaurant
router.put('/current', auth, async (req, res) => {
  try {
    // Determine which restaurant to update
    let restaurantId;
    
    if (req.user.role === 'superadmin' && req.query.restaurantId) {
      restaurantId = req.query.restaurantId;
    } else {
      restaurantId = req.user.restaurantId;
    }
    
    if (!restaurantId) {
      return res.status(400).json({ message: 'No restaurant ID available' });
    }
    
    const restaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      req.body,
      { new: true }
    );
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    res.json(restaurant);
  } catch (err) {
    console.error('Error updating restaurant:', err);
    res.status(500).json({ message: err.message });
  }
});

// Test email route
router.post('/test-email', auth, async (req, res) => {
  try {
    // Implement email testing logic here
    res.json({ message: 'Test email functionality' });
  } catch (err) {
    console.error('Error with test email:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all restaurants (for super admin)
router.get('/all', async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Accesso non autorizzato' });
    }
    
    const restaurants = await Restaurant.find().sort({ name: 1 });
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific restaurant
router.get('/:id', async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Accesso non autorizzato' });
    }
    
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Ristorante non trovato' });
    }
    
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new restaurant
router.post('/', async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Accesso non autorizzato' });
    }
    
    const restaurant = new Restaurant(req.body);
    const savedRestaurant = await restaurant.save();
    
    // Auto-create admin and kitchen users for this restaurant
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    
    // Generate temporary passwords
    const generateTempPassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let password = '';
      for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    
    // Create admin user
    const adminPassword = generateTempPassword();
    const restaurantName = savedRestaurant.name.replace(/\s+/g, '').toLowerCase();
    const adminUser = new User({
      name: `Admin ${savedRestaurant.name}`,
      email: `admin@${restaurantName}.it`,
      password: adminPassword,
      role: 'admin',
      restaurantId: savedRestaurant._id
    });
    
    // Create kitchen user
    const kitchenPassword = generateTempPassword();
    const kitchenUser = new User({
      name: `Cucina ${savedRestaurant.name}`,
      email: `cucina@${restaurantName}.it`,
      password: kitchenPassword,
      role: 'kitchen',
      restaurantId: savedRestaurant._id
    });
    
    // Save both users
    await Promise.all([adminUser.save(), kitchenUser.save()]);
    
    // Return restaurant with created user credentials
    res.status(201).json({
      restaurant: savedRestaurant,
      users: [
        {
          name: adminUser.name,
          email: adminUser.email,
          password: adminPassword,
          role: 'admin'
        },
        {
          name: kitchenUser.name,
          email: kitchenUser.email,
          password: kitchenPassword,
          role: 'kitchen'
        }
      ]
    });
  } catch (err) {
    console.error('Error creating restaurant and users:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update a restaurant
router.put('/:id', async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Accesso non autorizzato' });
    }
    
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Ristorante non trovato' });
    }
    
    res.json(restaurant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update restaurant status
router.patch('/:id', async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Accesso non autorizzato' });
    }
    
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { active: req.body.active },
      { new: true }
    );
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Ristorante non trovato' });
    }
    
    res.json(restaurant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router; 