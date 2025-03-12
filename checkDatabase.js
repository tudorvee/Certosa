// Database Validation Script
const mongoose = require('mongoose');
require('dotenv').config();

// Define simple models for checking structure
const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  role: String,
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  },
  active: Boolean,
  createdAt: Date
});

const RestaurantSchema = new mongoose.Schema({
  name: String,
  address: String,
  phone: String,
  email: String,
  createdAt: Date
});

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    validateDatabase();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define models without requiring files
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Restaurant = mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);

// Function to check database structure
async function validateDatabase() {
  console.log('\n======= DATABASE VALIDATION REPORT =======\n');
  
  try {
    // 1. Check all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name).join(', '));
    
    // 2. Check User collection structure
    const users = await User.find().lean();
    console.log(`\n📊 USERS (${users.length} records):`);
    
    if (users.length > 0) {
      console.log('Sample user document structure:');
      const sampleUser = users[0];
      console.log(JSON.stringify(sampleUser, null, 2));
      
      // Check for users without restaurantId
      const usersWithoutRestaurant = users.filter(u => !u.restaurantId);
      if (usersWithoutRestaurant.length > 0) {
        console.log(`⚠️ WARNING: Found ${usersWithoutRestaurant.length} users without restaurantId`);
        console.log('User IDs:', usersWithoutRestaurant.map(u => u._id).join(', '));
      } else {
        console.log('✅ All users have restaurantId assigned');
      }
      
      // Count users by role
      const roleCounts = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      console.log('Users by role:', roleCounts);
    }
    
    // 3. Check Restaurant collection
    const restaurants = await Restaurant.find().lean();
    console.log(`\n📊 RESTAURANTS (${restaurants.length} records):`);
    
    if (restaurants.length > 0) {
      console.log('Sample restaurant document structure:');
      console.log(JSON.stringify(restaurants[0], null, 2));
      
      // Check for restaurants referenced by users
      const restaurantIds = restaurants.map(r => r._id.toString());
      const userRestaurantIds = [...new Set(users.map(u => u.restaurantId?.toString()))].filter(Boolean);
      
      const orphanedRestaurants = restaurantIds.filter(id => !userRestaurantIds.includes(id));
      if (orphanedRestaurants.length > 0) {
        console.log(`⚠️ WARNING: Found ${orphanedRestaurants.length} restaurants not associated with any user`);
        console.log('Orphaned restaurant IDs:', orphanedRestaurants);
      } else {
        console.log('✅ All restaurants have associated users');
      }
      
      const invalidRestaurantRefs = userRestaurantIds.filter(id => !restaurantIds.includes(id));
      if (invalidRestaurantRefs.length > 0) {
        console.log(`❌ ERROR: Found ${invalidRestaurantRefs.length} users referencing non-existent restaurants`);
        console.log('Invalid restaurant IDs:', invalidRestaurantRefs);
      } else {
        console.log('✅ All user restaurant references are valid');
      }
    }
    
    console.log('\n======= END OF REPORT =======');
    
  } catch (error) {
    console.error('Error validating database:', error);
  } finally {
    setTimeout(() => {
      // Close the connection
      mongoose.connection.close();
      console.log('Database connection closed');
    }, 1000);
  }
}
