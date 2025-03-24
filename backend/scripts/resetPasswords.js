const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('../models/User');

const User = mongoose.model('User');

async function resetAdminPassword() {
  try {
    // Connect to production database
    // Use your actual production MongoDB URI here
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kitchen-order-app-prod');
    console.log('Connected to production database');

    // New password for admin
    const newPassword = 'Certosa2024!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update only admin users
    const result = await User.updateMany(
      { role: 'admin' }, 
      { password: hashedPassword }
    );
    
    // Get admin users to display their emails
    const adminUsers = await User.find({ role: 'admin' }, 'email name');
    
    if (adminUsers.length === 0) {
      console.log('No admin users found in the database.');
    } else {
      console.log('\nPasswords have been reset for the following admin users:');
      adminUsers.forEach(user => {
        console.log(`\nName: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`New Password: ${newPassword}`);
      });
    }

    console.log(`\nPassword reset completed. Updated ${result.modifiedCount} admin accounts.`);
    process.exit(0);
  } catch (error) {
    console.error('Password reset failed:', error);
    process.exit(1);
  }
}

resetAdminPassword(); 