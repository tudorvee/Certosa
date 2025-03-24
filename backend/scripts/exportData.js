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

async function exportData() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/kitchen-order-app');
    console.log('Connected to MongoDB');

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '../dev-data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Export each collection
    const collections = [
      { model: Restaurant, name: 'restaurants' },
      { model: User, name: 'users' },
      { model: Item, name: 'items' },
      { model: Order, name: 'orders' },
      { model: Category, name: 'categories' },
      { model: Supplier, name: 'suppliers' }
    ];

    for (const collection of collections) {
      const data = await collection.model.find({});
      fs.writeFileSync(
        path.join(outputDir, `${collection.name}.json`),
        JSON.stringify(data, null, 2)
      );
      console.log(`Exported ${collection.name}`);
    }

    console.log('Export completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

exportData(); 