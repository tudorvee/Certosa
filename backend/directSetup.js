require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ObjectId } = mongoose.Types;

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://certosa:7O3Noop9MhPNN0q5@cluster0.02pqg.mongodb.net/certosaDB?retryWrites=true&w=majority&appName=Cluster0';
console.log('Connecting to MongoDB...');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ MongoDB connected successfully');
  
  try {
    // Get direct access to the MongoDB driver client
    const db = mongoose.connection.db;
    
    // Create a unique restaurant ID
    const restaurantId = new ObjectId();
    
    // Create the restaurant
    console.log('Creating restaurant...');
    const restaurant = {
      _id: restaurantId,
      name: 'Pancrazio',
      address: 'Via Roma 123, 00100 Roma',
      phone: '+39 06 1234567',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('restaurants').insertOne(restaurant);
    console.log(`Restaurant created: ${restaurant.name} (ID: ${restaurant._id})`);
    
    // Hash password for users
    console.log('Creating users...');
    const salt = await bcrypt.genSalt(10);
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create users
    const users = [
      {
        name: 'Super Admin',
        email: 'superadmin@certosa.com',
        password: hashedPassword,
        role: 'superadmin',
        restaurantId: restaurantId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Pancrazio Admin',
        email: 'admin@pancrazio.com',
        password: hashedPassword,
        role: 'admin',
        restaurantId: restaurantId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Pancrazio Kitchen',
        email: 'kitchen@pancrazio.com',
        password: hashedPassword,
        role: 'kitchen',
        restaurantId: restaurantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('users').insertMany(users);
    console.log(`Created ${users.length} users`);
    
    // Create categories
    console.log('Creating categories...');
    const categories = [
      { name: 'Bevande', restaurantId: restaurantId, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Primi', restaurantId: restaurantId, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Secondi', restaurantId: restaurantId, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Dolci', restaurantId: restaurantId, createdAt: new Date(), updatedAt: new Date() }
    ];
    
    await db.collection('categories').insertMany(categories);
    console.log(`Created ${categories.length} categories`);
    
    // Create supplier
    console.log('Creating supplier...');
    const supplier = {
      name: 'Fornitore Locale',
      contactName: 'Mario Rossi',
      email: 'info@fornitorelocale.it',
      phone: '+39 06 7654321',
      restaurantId: restaurantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('suppliers').insertOne(supplier);
    console.log(`Supplier created: ${supplier.name}`);
    
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
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 