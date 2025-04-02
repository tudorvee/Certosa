require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailSending() {
  // Hard-code credentials for testing
  const EMAIL_USER = 'ristorantepancrazio@gmail.com';
  const APP_PASSWORD = 'qguhsnaatdmqwkuz'; // Updated App Password

  console.log('Testing email sending...');
  console.log('Using credentials:');
  console.log('- Email:', EMAIL_USER);
  console.log('- Password: ******');
  
  // Create transporter with verbose logging
  const transporter = nodemailer.createTransport({
    service: 'gmail',   // Use the Gmail service preset
    auth: {
      user: EMAIL_USER,
      pass: APP_PASSWORD
    },
    debug: true, // show debug output
    logger: true  // log information in console
  });
  
  console.log('Verifying connection...');
  try {
    const verified = await transporter.verify();
    console.log('Connection verified:', verified);
    
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Test Email" <${EMAIL_USER}>`,
      to: EMAIL_USER, // Send to yourself
      subject: 'Test Email ' + new Date().toISOString(),
      text: 'This is a test email to verify that sending is working.',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email sent at ${new Date().toLocaleString()}.</p>
        <p>If you're receiving this, email sending is working correctly!</p>
      `
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Email error:', error);
  }
}

testEmailSending().catch(console.error); 