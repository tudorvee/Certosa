const nodemailer = require('nodemailer');
const Restaurant = require('../models/Restaurant');

// Create a direct Gmail transporter - absolutely minimal
const createDirectTransporter = async () => {
  console.log('Creating DIRECT GMAIL transporter');
  
  // Gmail app password
  const EMAIL_USER = 'ristorantepancrazio@gmail.com';
  const APP_PASSWORD = 'jcesqbuhocfgawhs';
  
  console.log(`Using Gmail account: ${EMAIL_USER}`);
  console.log(`Using app password: ${'*'.repeat(APP_PASSWORD.length)}`);
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: APP_PASSWORD
    }
  });
  
  // Test the connection
  try {
    const verified = await transporter.verify();
    console.log('Transporter verified:', verified);
    return transporter;
  } catch (error) {
    console.error('Error verifying transporter:', error);
    throw error;
  }
};

// Super simplified email sending
const sendEmail = async (supplierEmail, items, restaurantId, note) => {
  try {
    console.log('🔴 SENDING EMAIL DIRECTLY TO:', supplierEmail);
    console.log('🔴 WITH NOTE:', note);
    
    // Get restaurant info
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }
    
    // Create direct transporter
    const transporter = await createDirectTransporter();
    
    // Build a simple HTML with the note visible
    let itemsHtml = '';
    for (const item of items) {
      itemsHtml += `<tr><td>${item.name}</td><td>${item.quantity} ${item.unit}</td></tr>`;
    }
    
    // Make the note extremely visible
    const noteHtml = note ? `
    <div style="padding:15px; margin:15px 0; background:#ffffd0; border:2px solid red;">
      <h2 style="color:red; margin-top:0;">NOTA:</h2>
      <p style="font-size:16px; font-weight:bold;">${note}</p>
    </div>` : '';
    
    // Simplified email template
    const emailHtml = `
    <html>
    <body>
      <h2>Ordine da ${restaurant.name}</h2>
      
      ${noteHtml}
      
      <table border="1" cellpadding="5" style="border-collapse:collapse; width:100%;">
        <tr style="background:#f0f0f0;">
          <th>Articolo</th>
          <th>Quantità</th>
        </tr>
        ${itemsHtml}
      </table>
      
      <p>Grazie,<br>${restaurant.name}</p>
    </body>
    </html>
    `;
    
    // Add the note to the subject line
    const subject = note 
      ? `🟡 ORDINE CON NOTA: ${note.substring(0, 20)}...` 
      : `Nuovo Ordine`;
      
    console.log('🔴 SENDING HTML EMAIL:', emailHtml);
    
    // Send the email
    const info = await transporter.sendMail({
      from: `"${restaurant.name}" <${process.env.EMAIL_USER || 'ristorantepancrazio@gmail.com'}>`,
      to: supplierEmail,
      subject: subject,
      html: emailHtml
    });
    
    console.log('🔴 EMAIL SENT:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Simple test email function
const sendTestEmail = async (restaurantId) => {
  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }
    
    // Create direct transporter
    const transporter = await createDirectTransporter();
    
    // Test HTML email
    const testHtml = `
    <html>
    <body>
      <h2>Test Email from ${restaurant.name}</h2>
      <p>This is a test email to verify that your email configuration works.</p>
      <p>Time: ${new Date().toISOString()}</p>
    </body>
    </html>
    `;
    
    const info = await transporter.sendMail({
      from: `"${restaurant.name}" <${process.env.EMAIL_USER || 'ristorantepancrazio@gmail.com'}>`,
      to: restaurant.emailConfig?.senderEmail || process.env.EMAIL_USER || 'ristorantepancrazio@gmail.com',
      subject: 'Test Email',
      html: testHtml
    });
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Test email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test email with note
const sendBasicEmail = async (supplierEmail, restaurantId, noteText) => {
  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }
    
    // Create direct transporter
    const transporter = await createDirectTransporter();
    
    // Test HTML with note
    const testHtml = `
    <html>
    <body>
      <h2>Test Email with Note</h2>
      
      <div style="padding:15px; margin:15px 0; background:#ffffd0; border:2px solid red;">
        <h2 style="color:red; margin-top:0;">NOTA DI TEST:</h2>
        <p style="font-size:16px; font-weight:bold;">${noteText}</p>
      </div>
      
      <p>Time: ${new Date().toISOString()}</p>
    </body>
    </html>
    `;
    
    const info = await transporter.sendMail({
      from: `"${restaurant.name}" <${process.env.EMAIL_USER || 'ristorantepancrazio@gmail.com'}>`,
      to: supplierEmail,
      subject: `🟡 TEST CON NOTA: ${noteText.substring(0, 20)}...`,
      html: testHtml
    });
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Basic email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendEmail,
  sendTestEmail,
  sendBasicEmail
}; 