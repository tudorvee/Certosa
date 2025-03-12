const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const Item = require('../models/Item');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// Get system stats (superadmin only)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Accesso non autorizzato' });
    }
    
    // Gather stats
    const stats = {
      restaurants: await Restaurant.countDocuments(),
      users: await User.countDocuments(),
      suppliers: await Supplier.countDocuments(),
      items: await Item.countDocuments(),
      orders: await Order.countDocuments()
    };
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 