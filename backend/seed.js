const mongoose = require('mongoose');
const Supplier = require('./models/Supplier');
const Item = require('./models/Item');
require('dotenv').config();

// Sample data
const suppliers = [
  { name: 'Fresh Foods Co.', email: 'orders@freshfoods.example.com', phone: '555-123-4567', address: '123 Main St' },
  { name: 'Seafood Express', email: 'sales@seafoodexpress.example.com', phone: '555-987-6543', address: '456 Ocean Ave' }
];

const items = [
  { name: 'Tomatoes', description: 'Fresh Roma tomatoes', unit: 'kg' },
  { name: 'Lettuce', description: 'Iceberg lettuce', unit: 'head' },
  { name: 'Salmon', description: 'Fresh Atlantic salmon', unit: 'kg' }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected for seeding');
    
    // Clear existing data
    await Supplier.deleteMany({});
    await Item.deleteMany({});
    
    // Add suppliers
    const createdSuppliers = await Supplier.insertMany(suppliers);
    console.log('Suppliers added:', createdSuppliers.length);
    
    // Add items with supplier references
    const itemsWithSuppliers = [
      { ...items[0], supplierId: createdSuppliers[0]._id },
      { ...items[1], supplierId: createdSuppliers[0]._id },
      { ...items[2], supplierId: createdSuppliers[1]._id }
    ];
    
    const createdItems = await Item.insertMany(itemsWithSuppliers);
    console.log('Items added:', createdItems.length);
    
    console.log('Database seeded successfully!');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error seeding database:', err);
    process.exit(1);
  }); 