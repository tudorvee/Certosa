require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');

// New email config with the App Password
const emailConfig = {
  senderName: 'Ristorante Pancrazio',
  senderEmail: 'ristorantepancrazio@gmail.com',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: 'ristorantepancrazio@gmail.com',
  smtpPassword: 'qguhsnaatdmqwkuz',  // New App Password
  useSsl: false
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB, updating restaurant email configuration...');
    updateRestaurants();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function updateRestaurants() {
  try {
    // Find all restaurants
    const restaurants = await Restaurant.find({});
    
    if (restaurants.length === 0) {
      console.error('No restaurants found');
      process.exit(1);
    }
    
    console.log(`Found ${restaurants.length} restaurants. Updating email configurations...`);
    
    // Update them all
    for (const restaurant of restaurants) {
      console.log(`Updating restaurant: ${restaurant.name} (ID: ${restaurant._id})`);
      
      // Update email configuration
      restaurant.emailConfig = {
        ...restaurant.emailConfig,
        ...emailConfig
      };
      
      // Save the updated restaurant
      await restaurant.save();
      
      console.log(`✅ Updated ${restaurant.name}`);
    }
    
    console.log('✅ All restaurant email configurations updated successfully!');
    console.log('New configuration:', {
      ...emailConfig,
      smtpPassword: '********' // Don't log the actual password
    });
    
    // Close the connection
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error updating restaurants:', error);
    mongoose.connection.close();
    process.exit(1);
  }
} 