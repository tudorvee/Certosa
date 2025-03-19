require('./models/Restaurant');
require('./models/User');
require('./models/Item');
require('./models/Supplier');
require('./models/Order');
require('./models/Category');
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://certosa-frontend.onrender.com' 
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Replace the existing mongoose.connect with this
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/certosaDB';
console.log('Attempting to connect to MongoDB...');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 