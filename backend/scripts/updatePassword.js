const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function updatePassword() {
  try {
    await mongoose.connect('mongodb+srv://certosa:7O3Noop9MhPNN0q5@cluster0.02pqg.mongodb.net/certosaDB?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to MongoDB Atlas');

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