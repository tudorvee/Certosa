require('./models/Restaurant');
require('./models/User');
require('./models/Item');
require('./models/Supplier');
require('./models/Order');
require('./models/Category');
require('./models/UnitOfMeasure');
require('dotenv').config({
  path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env'
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://certosa-frontend.onrender.com' 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3006'],
  credentials: true
}));
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    // Skip body parsing for empty bodies on specific endpoints
    if (req.url.includes('/soft-delete') && req.method === 'PUT') {
      if (buf.length === 0 || buf.toString() === 'null') {
        req.body = {};
      }
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

// Replace the existing mongoose.connect with this
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://certosa:7O3Noop9MhPNN0q5@cluster0.02pqg.mongodb.net/certosaDB?retryWrites=true&w=majority&appName=Cluster0';
console.log('Attempting to connect to MongoDB Atlas...');

mongoose.connect(MONGODB_URI)
.then(() => console.log('MongoDB Atlas connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/restaurants', require('./routes/restaurantRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/units', require('./routes/unitRoutes'));

// EMERGENCY DIRECT ROUTE - FOR TESTING ONLY
app.post('/emergency-email-test', async (req, res) => {
  try {
    console.log('🚨 EMERGENCY EMAIL TEST');
    console.log('Request body:', req.body);
    
    // Find a restaurant
    const Restaurant = require('./models/Restaurant');
    const Supplier = require('./models/Supplier');
    const nodemailer = require('nodemailer');
    
    const restaurant = await Restaurant.findOne({ 'emailConfig.senderEmail': { $exists: true } });
    if (!restaurant) {
      return res.status(400).json({ success: false, message: 'No restaurant found with email config' });
    }
    
    // Find a supplier
    const supplier = await Supplier.findOne({ restaurantId: restaurant._id });
    if (!supplier || !supplier.email) {
      return res.status(400).json({ success: false, message: 'No supplier found with email' });
    }
    
    // Create a transporter directly
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || restaurant.emailConfig.senderEmail,
        pass: process.env.EMAIL_PASS || restaurant.emailConfig.smtpPassword
      },
      debug: true,
      logger: true
    });
    
    // Create a super simple email with note
    const noteText = req.body.note || "This is a direct test note";
    const emailHtml = `
      <h2>EMERGENCY TEST EMAIL</h2>
      <p>This is a direct test of the email note functionality.</p>
      <hr>
      <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #ff0000;">
        <p><strong>TEST NOTE:</strong></p>
        <p>${noteText}</p>
      </div>
      <hr>
      <p>Timestamp: ${new Date().toISOString()}</p>
    `;
    
    // Send the email
    const info = await transporter.sendMail({
      from: `"TEST EMAIL" <${process.env.EMAIL_USER || restaurant.emailConfig.senderEmail}>`,
      to: supplier.email,
      subject: 'EMERGENCY TEST EMAIL WITH NOTE',
      html: emailHtml
    });
    
    res.json({
      success: true,
      message: 'Emergency test email sent',
      to: supplier.email,
      emailHtml: emailHtml,
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Emergency email test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 