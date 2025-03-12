// Script to test email configuration
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
require('dotenv').config();

// Restaurant name to test
const restaurantName = 'Ristorante Pancrazio';

// Define the Restaurant schema
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

// Make sure the Restaurant model is defined only once
const Restaurant = mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB. Testing email configuration...');
    testEmailService();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function testEmailService() {
  try {
    // Find the restaurant by name
    const restaurant = await Restaurant.findOne({ name: restaurantName });
    
    if (!restaurant) {
      console.error(`Restaurant "${restaurantName}" not found`);
      process.exit(1);
    }
    
    console.log(`Found restaurant: ${restaurant.name} (ID: ${restaurant._id})`);
    
    // Check if email config exists
    if (!restaurant.emailConfig || !restaurant.emailConfig.smtpUser || !restaurant.emailConfig.smtpPassword) {
      console.error('Restaurant has no email configuration');
      process.exit(1);
    }
    
    console.log('Testing email configuration...');
    console.log('Email config:', {
      host: restaurant.emailConfig.smtpHost,
      port: restaurant.emailConfig.smtpPort,
      secure: restaurant.emailConfig.useSsl,
      user: restaurant.emailConfig.smtpUser,
      // Not showing password for security
    });
    
    // Create a test transporter
    const transporter = nodemailer.createTransport({
      host: restaurant.emailConfig.smtpHost,
      port: restaurant.emailConfig.smtpPort,
      secure: restaurant.emailConfig.useSsl,
      auth: {
        user: restaurant.emailConfig.smtpUser,
        pass: restaurant.emailConfig.smtpPassword
      },
      debug: true,
      logger: true
    });
    
    // Verify connection
    console.log('Verifying SMTP connection...');
    const verification = await transporter.verify();
    console.log('SMTP Verification:', verification);
    
    // Send a test email
    console.log('Sending test email...');
    const testRecipient = restaurant.emailConfig.smtpUser; // Send to ourselves
    
    const info = await transporter.sendMail({
      from: `"${restaurant.emailConfig.senderName}" <${restaurant.emailConfig.senderEmail}>`,
      to: testRecipient,
      subject: 'Test Email - Configurazione Sistema',
      text: 'Questo è un test per verificare la configurazione email del sistema.',
      html: '<b>Questo è un test per verificare la configurazione email del sistema.</b>'
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    
    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error testing email service:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}
