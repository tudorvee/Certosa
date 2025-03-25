require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create or find the restaurant
    let restaurant = await Restaurant.findOne({ name: 'Certosa' });
    if (!restaurant) {
      restaurant = await Restaurant.create({
        name: 'Certosa',
        address: 'Via Roma 123, Milano',
        phone: '02 1234567',
        email: 'info@certosa.com'
      });
      console.log('Created new restaurant:', restaurant.name);
    } else {
      console.log('Using existing restaurant:', restaurant.name);
    }

    // Create admin user
    const adminData = {
      name: 'Admin',
      email: 'admin@certosa.com',
      password: 'Certosa2024!',
      role: 'admin',
      restaurantId: restaurant._id
    };

    // Check if admin exists
    let admin = await User.findOne({ email: adminData.email });
    if (admin) {
      // Update existing admin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);
      admin = await User.findOneAndUpdate(
        { email: adminData.email },
        { 
          ...adminData,
          password: hashedPassword
        },
        { new: true }
      );
      console.log('Updated existing admin user:', admin.email);
    } else {
      // Create new admin
      admin = await User.create(adminData);
      console.log('Created new admin user:', admin.email);
    }

    // Create kitchen user
    const kitchenData = {
      name: 'Cucina',
      email: 'kitchen@certosa.com',
      password: 'Certosa2024!',
      role: 'kitchen',
      restaurantId: restaurant._id
    };

    // Check if kitchen user exists
    let kitchen = await User.findOne({ email: kitchenData.email });
    if (kitchen) {
      // Update existing kitchen user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(kitchenData.password, salt);
      kitchen = await User.findOneAndUpdate(
        { email: kitchenData.email },
        {
          ...kitchenData,
          password: hashedPassword
        },
        { new: true }
      );
      console.log('Updated existing kitchen user:', kitchen.email);
    } else {
      // Create new kitchen user
      kitchen = await User.create(kitchenData);
      console.log('Created new kitchen user:', kitchen.email);
    }

    console.log('\n===== SETUP COMPLETE =====');
    console.log('\nYou can now log in with the following accounts:');
    console.log('\nAdmin Account:');
    console.log('Email: admin@certosa.com');
    console.log('Password: Certosa2024!');
    console.log('\nKitchen Account:');
    console.log('Email: kitchen@certosa.com');
    console.log('Password: Certosa2024!');
    console.log('\n=========================');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createAdmin(); 