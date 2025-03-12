const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email }).populate('restaurantId', 'name');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    // Check if user is active
    if (!user.active) return res.status(403).json({ message: 'Account is deactivated' });
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, restaurantId: user.restaurantId._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurant: {
          id: user.restaurantId._id,
          name: user.restaurantId.name
        }
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('restaurantId', 'name');
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 