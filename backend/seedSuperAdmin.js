require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
require('./models/Restaurant'); // Make sure model is registered first

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected for superadmin setup');
    
    try {
      // Check if superadmin exists
      const superadminExists = await User.findOne({ role: 'superadmin' });
      
      if (superadminExists) {
        console.log('Superadmin already exists:', superadminExists.email);
        mongoose.connection.close();
        return;
      }
      
      // Create a system restaurant (for superadmin)
      let systemRestaurant = await Restaurant.findOne({ name: 'System Administration' });
      
      if (!systemRestaurant) {
        systemRestaurant = await Restaurant.create({
          name: 'System Administration',
          address: 'System Address',
          active: true
        });
        console.log('System restaurant created');
      }
      
      // Create superadmin user
      const superadmin = await User.create({
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: 'superadmin123',  // This will be hashed by the pre-save hook
        role: 'superadmin',
        restaurantId: systemRestaurant._id
      });
      
      console.log('Superadmin created successfully!');
      console.log('Email: superadmin@example.com');
      console.log('Password: superadmin123');
      
    } catch (err) {
      console.error('Error creating superadmin:', err);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 