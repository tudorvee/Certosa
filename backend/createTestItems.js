const mongoose = require('mongoose');
const Item = require('./models/Item');
const Supplier = require('./models/Supplier');
const Restaurant = require('./models/Restaurant');

const createTestItems = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/certosaDB', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    
    // First let's find a supplier and restaurant
    const supplier = await Supplier.findOne({});
    const restaurant = await Restaurant.findOne({});
    
    if (!supplier || !restaurant) {
      console.log('No supplier or restaurant found. Please create them first.');
      return;
    }
    
    console.log('Found supplier:', supplier.name);
    console.log('Found restaurant:', restaurant.name);
    
    // Create test items
    const testItems = [
      { name: 'Test Item 1', unit: 'kg', supplierId: supplier._id, restaurantId: restaurant._id, isActive: true },
      { name: 'Test Item 2', unit: 'pz', supplierId: supplier._id, restaurantId: restaurant._id, isActive: true },
      { name: 'Test Item 3', unit: 'lt', supplierId: supplier._id, restaurantId: restaurant._id, isActive: false }
    ];
    
    await Item.insertMany(testItems);
    console.log('Created test items');
    
    const items = await Item.find({});
    console.log('Items:', items.length);
    console.log(items.map(i => ({ id: i._id.toString(), name: i.name, isActive: i.isActive })));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
};

createTestItems(); 