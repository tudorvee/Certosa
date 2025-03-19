require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://certosa:7O3Noop9MhPNN0q5@cluster0.02pqg.mongodb.net/certosaDB?retryWrites=true&w=majority&appName=Cluster0';
console.log('Connecting to MongoDB...');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ MongoDB connected successfully');
  
  try {
    // Get direct access to the MongoDB driver client
    const db = mongoose.connection.db;
    
    console.log('\n===== DATABASE INFO =====');
    console.log('Current Database:', db.databaseName);
    
    // List all collections
    console.log('\n===== COLLECTIONS =====');
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:`);
    collections.forEach(collection => {
      console.log(` - ${collection.name}`);
    });
    
    // Check if any data exists in each collection (if collections exist)
    if (collections.length > 0) {
      console.log('\n===== COLLECTION COUNTS =====');
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(` - ${collection.name}: ${count} documents`);
      }
      
      // Get a sample from each collection
      console.log('\n===== SAMPLE DOCUMENTS =====');
      for (const collection of collections) {
        const documents = await db.collection(collection.name).find().limit(1).toArray();
        if (documents.length > 0) {
          console.log(`\nSample from ${collection.name}:`);
          console.log(JSON.stringify(documents[0], null, 2));
        }
      }
    }
    
    // Get all tests from the test collection (created by our previous script)
    const tests = await db.collection('tests').find().toArray();
    console.log('\n===== TEST COLLECTION =====');
    console.log(`Found ${tests.length} test documents`);
    tests.forEach(test => {
      console.log(` - ${test.name}, created at ${test.timestamp}`);
    });
    
    console.log('\n===== DATABASE CHECK COMPLETE =====');
    
  } catch (err) {
    console.error('Error checking data:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 