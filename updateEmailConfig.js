// Script to update restaurant email configuration
const mongoose = require('mongoose');
require('dotenv').config();

// Define the Restaurant schema and model
const RestaurantSchema = new mongoose.Schema({
  name: String,
  address: String,
  phone: String,
  email: String,
  emailConfig: {
    senderName: String,
    senderEmail: String,
    smtpHost: String,
    smtpPort: Number,
    smtpUser: String,
    smtpPassword: String,
    useSsl: Boolean
  },
  active: Boolean,
  createdAt: Date
});

// Restaurant name and new email config
const restaurantName = 'Ristorante Pancrazio';
const emailConfig = {
  senderName: 'Ristorante Pancrazio',
  senderEmail: 'ristorantepancrazio@gmail.com',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: 'ristorantepancrazio@gmail.com',
  smtpPassword: 'xzchhmcbbfxytfxh',
  useSsl: false
};

// Make sure the Restaurant model is defined only once
const Restaurant = mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB. Updating restaurant email configuration...');
    updateRestaurant();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function updateRestaurant() {
  try {
    // Find the restaurant by name
    const restaurant = await Restaurant.findOne({ name: restaurantName });
    
    if (!restaurant) {
      console.error(`Restaurant "${restaurantName}" not found`);
      process.exit(1);
    }
    
    console.log(`Found restaurant: ${restaurant.name} (ID: ${restaurant._id})`);
    
    // Update email configuration
    restaurant.emailConfig = emailConfig;
    
    // Save the updated restaurant
    await restaurant.save();
    
    console.log('✅ Email configuration updated successfully!');
    console.log('New configuration:', emailConfig);
    
    // Also update the .env file as a backup
    console.log('\nDon\'t forget to update your .env file with:');
    console.log(`EMAIL_USER=${emailConfig.smtpUser}`);
    console.log(`EMAIL_PASS=${emailConfig.smtpPassword}`);
    
    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error updating restaurant:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}
