require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/certosaDB';
console.log('Connecting to MongoDB...');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Load models
require('./models/Restaurant');
require('./models/User');
require('./models/Category');
require('./models/Supplier');
const Restaurant = mongoose.model('Restaurant');
const User = mongoose.model('User');
const Category = mongoose.model('Category');
const Supplier = mongoose.model('Supplier');

async function setupPancrazio() {
  try {
    console.log('Starting setup process...');

    // Create the restaurant
    const restaurant = new Restaurant({
      name: 'Pancrazio',
      address: 'Via Roma 123, 00100 Roma',
      phone: '+39 06 1234567'
    });
    await restaurant.save();
    console.log(`Restaurant created: ${restaurant.name} (ID: ${restaurant._id})`);

    // Hash passwords - using same password for all accounts for simplicity
    const salt = await bcrypt.genSalt(10);
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a superadmin user (assigning restaurantId because it's required by the model)
    const superadmin = new User({
      name: 'Super Admin',
      email: 'superadmin@certosa.com',
      password: hashedPassword,
      role: 'superadmin',
      restaurantId: restaurant._id
    });
    await superadmin.save();
    console.log(`Superadmin created: ${superadmin.email}`);

    // Create an admin user for Pancrazio
    const admin = new User({
      name: 'Pancrazio Admin',
      email: 'admin@pancrazio.com',
      password: hashedPassword,
      role: 'admin',
      restaurantId: restaurant._id
    });
    await admin.save();
    console.log(`Admin created: ${admin.email} for restaurant ${restaurant.name}`);

    // Create a kitchen user for Pancrazio
    const kitchen = new User({
      name: 'Pancrazio Kitchen',
      email: 'kitchen@pancrazio.com',
      password: hashedPassword,
      role: 'kitchen',
      restaurantId: restaurant._id
    });
    await kitchen.save();
    console.log(`Kitchen user created: ${kitchen.email} for restaurant ${restaurant.name}`);

    // Create some default categories for this restaurant
    const categories = [
      { name: 'Bevande', restaurantId: restaurant._id },
      { name: 'Primi', restaurantId: restaurant._id },
      { name: 'Secondi', restaurantId: restaurant._id },
      { name: 'Dolci', restaurantId: restaurant._id }
    ];
    await Category.insertMany(categories);
    console.log(`Created ${categories.length} default categories`);

    // Create a default supplier
    const supplier = new Supplier({
      name: 'Fornitore Locale',
      contactName: 'Mario Rossi',
      email: 'info@fornitorelocale.it',
      phone: '+39 06 7654321',
      restaurantId: restaurant._id
    });
    await supplier.save();
    console.log(`Default supplier created: ${supplier.name}`);

    console.log('\n===== SETUP COMPLETE =====');
    console.log('\nYou can now log in with the following accounts:');
    console.log('\nSuperadmin Account:');
    console.log('Email: superadmin@certosa.com');
    console.log('Password: password123');
    console.log('\nPancrazio Admin Account:');
    console.log('Email: admin@pancrazio.com');
    console.log('Password: password123');
    console.log('\nPancrazio Kitchen Account:');
    console.log('Email: kitchen@pancrazio.com');
    console.log('Password: password123');
    console.log('\n=========================');

  } catch (err) {
    console.error('Error during setup:', err);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

setupPancrazio(); 