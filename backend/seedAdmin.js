require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected for admin setup');
    
    try {
      // Create a restaurant
      const restaurant = await Restaurant.create({
        name: 'Ristorante Principale',
        address: 'Via Roma 123, Milano',
        phone: '02 1234567',
        email: 'info@ristorantepancrazio.com'
      });
      
      console.log('Restaurant created:', restaurant.name);
      
      // Check if admin exists
      const adminExists = await User.findOne({ email: 'admin@example.com' });
      
      if (!adminExists) {
        // Create an admin user
        const adminUser = await User.create({
          name: 'Admin',
          email: 'admin@example.com',
          password: 'password123',  // This will be hashed by the pre-save hook
          role: 'admin',
          restaurantId: restaurant._id
        });
        
        console.log('Admin user created:', adminUser.email);
      } else {
        console.log('Admin user already exists');
      }
      
      // Create a kitchen user
      const kitchenExists = await User.findOne({ email: 'kitchen@example.com' });
      
      if (!kitchenExists) {
        const kitchenUser = await User.create({
          name: 'Cucina',
          email: 'kitchen@example.com',
          password: 'kitchen123',  // This will be hashed by the pre-save hook
          role: 'kitchen',
          restaurantId: restaurant._id
        });
        
        console.log('Kitchen user created:', kitchenUser.email);
      } else {
        console.log('Kitchen user already exists');
      }
      
      console.log('Setup complete! You can now log in with:');
      console.log('Admin: admin@example.com / password123');
      console.log('Kitchen: kitchen@example.com / kitchen123');
      
    } catch (err) {
      console.error('Error setting up admin:', err);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 