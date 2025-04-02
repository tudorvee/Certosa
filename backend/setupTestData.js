const mongoose = require('mongoose');
const Item = require('./models/Item');
const Supplier = require('./models/Supplier');
const Restaurant = require('./models/Restaurant');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const setupTestData = async () => {
  try {
    await mongoose.connect('mongodb+srv://certosa:7O3Noop9MhPNN0q5@cluster0.02pqg.mongodb.net/certosaDB?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Create test restaurant if it doesn't exist
    let restaurant = await Restaurant.findOne({ name: 'Test Restaurant' });
    
    if (!restaurant) {
      restaurant = new Restaurant({
        name: 'Test Restaurant',
        address: '123 Test Street',
        phone: '123-456-7890'
      });
      await restaurant.save();
      console.log('Created test restaurant:', restaurant.name);
    } else {
      console.log('Using existing restaurant:', restaurant.name);
    }
    
    // Create test user if they don't exist
    let user = await User.findOne({ email: 'admin@test.com' });
    
    if (!user) {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      user = new User({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
        restaurantId: restaurant._id
      });
      await user.save();
      console.log('Created test user:', user.email);
    } else {
      console.log('Using existing user:', user.email);
    }
    
    // Create test supplier if it doesn't exist
    let supplier = await Supplier.findOne({ name: 'Test Supplier', restaurantId: restaurant._id });
    
    if (!supplier) {
      supplier = new Supplier({
        name: 'Test Supplier',
        contactName: 'John Supplier',
        email: 'supplier@test.com',
        phone: '123-456-7890',
        restaurantId: restaurant._id
      });
      await supplier.save();
      console.log('Created test supplier:', supplier.name);
    } else {
      console.log('Using existing supplier:', supplier.name);
    }
    
    // Create test items with various isActive states
    const existingItemCount = await Item.countDocuments({ restaurantId: restaurant._id });
    
    if (existingItemCount === 0) {
      const testItems = [
        { 
          name: 'Active Item 1', 
          unit: 'kg', 
          supplierId: supplier._id, 
          restaurantId: restaurant._id, 
          isActive: true 
        },
        { 
          name: 'Active Item 2', 
          unit: 'pz', 
          supplierId: supplier._id, 
          restaurantId: restaurant._id, 
          isActive: true 
        },
        { 
          name: 'Inactive Item 1', 
          unit: 'lt', 
          supplierId: supplier._id, 
          restaurantId: restaurant._id, 
          isActive: false 
        },
        { 
          name: 'Inactive Item 2', 
          unit: 'box', 
          supplierId: supplier._id, 
          restaurantId: restaurant._id, 
          isActive: false 
        }
      ];
      
      await Item.insertMany(testItems);
      console.log('Created test items');
    } else {
      console.log(`Using ${existingItemCount} existing items`);
    }
    
    // Verify the data
    const items = await Item.find({ restaurantId: restaurant._id });
    console.log('Items total count:', items.length);
    console.log('Active items:', items.filter(i => i.isActive !== false).length);
    console.log('Inactive items:', items.filter(i => i.isActive === false).length);
    
    console.log('Item details:');
    console.log(items.map(i => ({ 
      id: i._id.toString(), 
      name: i.name, 
      isActive: i.isActive 
    })));
    
    console.log('\nSetup completed successfully');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
};

setupTestData(); 