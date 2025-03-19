require('dotenv').config();
const mongoose = require('mongoose');

// Use the same connection string from your .env file or hardcode for testing
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://certosa:7O3Noop9MhPNN0q5@cluster0.02pqg.mongodb.net/certosaDB?retryWrites=true&w=majority&appName=Cluster0';

console.log('Testing MongoDB connection...');
console.log('Connection string (masked):', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ MongoDB connected successfully');
  
  // Create a test model
  const TestSchema = new mongoose.Schema({
    name: String,
    timestamp: { type: Date, default: Date.now }
  });
  
  const Test = mongoose.model('Test', TestSchema);
  
  try {
    // Test write operation
    console.log('Testing write operation...');
    const testDoc = new Test({ name: 'Connection Test ' + Date.now() });
    await testDoc.save();
    console.log('✅ Write operation successful');
    
    // Test read operation
    console.log('Testing read operation...');
    const results = await Test.find().limit(5);
    console.log(`✅ Read operation successful. Found ${results.length} test documents`);
    results.forEach(doc => console.log(` - ${doc.name}, created at ${doc.timestamp}`));
    
    // Optional: Clean up test document
    // await Test.deleteOne({ _id: testDoc._id });
    // console.log('✅ Cleanup successful');
    
    console.log('\n✅✅✅ ALL TESTS PASSED! Your MongoDB connection is working properly.');
  } catch (err) {
    console.error('❌ Error during test operations:', err);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
}); 