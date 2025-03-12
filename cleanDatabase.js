// Database Cleanup Script
const mongoose = require('mongoose');
require('dotenv').config();

console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB. Starting cleanup...');
    cleanupDatabase();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function cleanupDatabase() {
  try {
    // Get references to the collections
    const itemsCollection = mongoose.connection.db.collection('items');
    const suppliersCollection = mongoose.connection.db.collection('suppliers');
    const ordersCollection = mongoose.connection.db.collection('orders');
    
    // Store count before deletion for reporting
    const itemCount = await itemsCollection.countDocuments();
    const supplierCount = await suppliersCollection.countDocuments();
    const orderCount = await ordersCollection.countDocuments();
    
    // Delete all documents from these collections
    await itemsCollection.deleteMany({});
    console.log(`✅ Deleted ${itemCount} items from the database`);
    
    await suppliersCollection.deleteMany({});
    console.log(`✅ Deleted ${supplierCount} suppliers from the database`);
    
    await ordersCollection.deleteMany({});
    console.log(`✅ Deleted ${orderCount} orders from the database`);
    
    console.log('\n🧹 Database cleanup completed successfully!\n');
    console.log('All items, suppliers, and orders have been removed.');
    console.log('Your database is now ready for multi-tenant data with proper restaurant IDs.');
    
    // Close the connection
    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error during database cleanup:', error);
    mongoose.connection.close();
  }
}
