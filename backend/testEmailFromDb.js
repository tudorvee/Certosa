require('dotenv').config();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const Restaurant = require('./models/Restaurant');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB. Testing email from restaurant configuration...');
    testEmailFromDb();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function testEmailFromDb() {
  try {
    // Find first restaurant
    const restaurant = await Restaurant.findOne({});
    if (!restaurant) {
      console.error('No restaurant found');
      process.exit(1);
    }
    
    console.log(`Using configuration from restaurant: ${restaurant.name} (ID: ${restaurant._id})`);
    
    // Log email config (without password)
    console.log('Email config:', {
      senderName: restaurant.emailConfig.senderName,
      senderEmail: restaurant.emailConfig.senderEmail,
      smtpHost: restaurant.emailConfig.smtpHost,
      smtpPort: restaurant.emailConfig.smtpPort,
      smtpUser: restaurant.emailConfig.smtpUser,
      useSsl: restaurant.emailConfig.useSsl,
      // Show password length but not actual password
      passwordLength: restaurant.emailConfig.smtpPassword ? restaurant.emailConfig.smtpPassword.length : 0
    });
    
    // Create transporter with restaurant config
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
    
    // Test the connection
    console.log('Verifying connection...');
    const verified = await transporter.verify();
    console.log('Connection verified:', verified);
    
    // Send a test email
    console.log('Sending test email...');
    const testHtml = `
    <html>
    <body>
      <h2>Test Email from DB Config</h2>
      <p>This is a test email using the restaurant configuration from the database.</p>
      <p>Restaurant: ${restaurant.name}</p>
      <p>Time: ${new Date().toLocaleString()}</p>
    </body>
    </html>
    `;
    
    const info = await transporter.sendMail({
      from: `"${restaurant.emailConfig.senderName}" <${restaurant.emailConfig.senderEmail}>`,
      to: restaurant.emailConfig.senderEmail, // Send to same email
      subject: 'Test Email Using DB Config',
      html: testHtml
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    // Close the connection
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error testing email from DB:', error);
    mongoose.connection.close();
    process.exit(1);
  }
} 