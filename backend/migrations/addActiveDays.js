require('dotenv').config();
const mongoose = require('mongoose');
const Item = require('../models/Item');

async function migrate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all items to have the activeDays field
    const result = await Item.updateMany(
      { activeDays: { $exists: false } },
      { 
        $set: { 
          activeDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        } 
      }
    );

    console.log(`Updated ${result.modifiedCount} items`);
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate(); 