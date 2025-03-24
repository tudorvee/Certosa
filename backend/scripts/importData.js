const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import models
require('../models/Restaurant');
require('../models/User');
require('../models/Item');
require('../models/Order');
require('../models/Category');
require('../models/Supplier');

const Restaurant = mongoose.model('Restaurant');
const User = mongoose.model('User');
const Item = mongoose.model('Item');
const Order = mongoose.model('Order');
const Category = mongoose.model('Category');
const Supplier = mongoose.model('Supplier');

async function importData() {
  try {
    // Connect to development database
    await mongoose.connect('mongodb://localhost:27017/kitchen-order-app-dev');
    console.log('Connected to development database');

    // Clear existing data
    await Promise.all([
      Restaurant.deleteMany({}),
      User.deleteMany({}),
      Item.deleteMany({}),
      Order.deleteMany({}),
      Category.deleteMany({}),
      Supplier.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Import each collection
    const collections = [
      { model: Restaurant, name: 'restaurants' },
      { model: User, name: 'users' },
      { model: Item, name: 'items' },
      { model: Order, name: 'orders' },
      { model: Category, name: 'categories' },
      { model: Supplier, name: 'suppliers' }
    ];

    for (const collection of collections) {
      const filePath = path.join(__dirname, '../dev-data', `${collection.name}.json`);
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        await collection.model.insertMany(data);
        console.log(`Imported ${collection.name}`);
      } else {
        console.log(`No data file found for ${collection.name}`);
      }
    }

    console.log('Import completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

importData(); 