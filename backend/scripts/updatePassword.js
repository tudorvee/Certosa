const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function updatePassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/kitchen-order-app-dev');
    console.log('Connected to MongoDB');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('12345', salt);

    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'admin@example.com' },
      { $set: { password: hashedPassword } }
    );

    console.log('Password updated successfully');
    console.log(result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

updatePassword(); 