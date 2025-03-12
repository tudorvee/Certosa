const nodemailer = require('nodemailer');
const Restaurant = require('../models/Restaurant');

// Create a transporter cache to avoid creating a new transporter for each email
const transporterCache = {};

/**
 * Check if the email credentials are valid by verifying with the SMTP server
 */
const verifyEmailCredentials = async (transporter) => {
  try {
    // This will actually try to connect to the server and verify the credentials
    const verification = await transporter.verify();
    console.log("SMTP verification successful:", verification);
    return true;
  } catch (error) {
    console.error("SMTP verification failed:", error.message);
    throw new Error(`Email configuration verification failed: ${error.message}`);
  }
};

const getTransporter = async (restaurantId) => {
  console.log(`Creating email transporter for restaurant ${restaurantId}`);
  
  // If we already have a transporter for this restaurant, reuse it
  if (transporterCache[restaurantId]) {
    console.log("Using cached transporter");
    return transporterCache[restaurantId];
  }
  
  // Get the restaurant's email config
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    console.error(`Restaurant not found with ID: ${restaurantId}`);
    throw new Error('Restaurant not found');
  }
  
  console.log("Restaurant found:", restaurant.name);

  // Check if the restaurant has a complete email configuration
  const hasCompleteEmailConfig = restaurant.emailConfig && 
    restaurant.emailConfig.smtpUser && 
    restaurant.emailConfig.smtpPassword &&
    restaurant.emailConfig.senderEmail;
  
  if (!hasCompleteEmailConfig) {
    console.error(`Restaurant ${restaurant.name} (${restaurantId}) has incomplete email configuration`);
    
    // Check if this is a test environment where we can use fallback
    if (process.env.NODE_ENV === 'development' && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log("DEVELOPMENT MODE: Using fallback email configuration from environment variables");
      
      // Only in development, create a fallback transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        // Debug settings
        debug: true,
        logger: true
      });
      
      console.log("Using Gmail credentials from .env file");
      
      // Verify and cache
      await verifyEmailCredentials(transporter);
      transporterCache[restaurantId] = transporter;
      return transporter;
    } else {
      // In production, we require complete email config
      const missingFields = [];
      if (!restaurant.emailConfig) missingFields.push('configurazione email completa');
      else {
        if (!restaurant.emailConfig.smtpUser) missingFields.push('SMTP Username');
        if (!restaurant.emailConfig.smtpPassword) missingFields.push('SMTP Password');
        if (!restaurant.emailConfig.senderEmail) missingFields.push('Email Mittente');
      }
      
      throw new Error(`Configurazione email incompleta per il ristorante ${restaurant.name}. Campi mancanti: ${missingFields.join(', ')}`);
    }
  }
  
  // Log email configuration (without password)
  console.log("Using email config:", {
    host: restaurant.emailConfig.smtpHost,
    port: restaurant.emailConfig.smtpPort,
    secure: restaurant.emailConfig.useSsl,
    user: restaurant.emailConfig.smtpUser,
    senderEmail: restaurant.emailConfig.senderEmail,
    senderName: restaurant.emailConfig.senderName
  });
  
  // Create a transporter with the restaurant's config
  const transporter = nodemailer.createTransport({
    host: restaurant.emailConfig.smtpHost,
    port: restaurant.emailConfig.smtpPort,
    secure: restaurant.emailConfig.useSsl,
    auth: {
      user: restaurant.emailConfig.smtpUser,
      pass: restaurant.emailConfig.smtpPassword
    },
    // Debug settings
    debug: true,
    logger: true
  });
  
  // Verify the connection and credentials
  await verifyEmailCredentials(transporter);
  
  // Cache the transporter for future use
  transporterCache[restaurantId] = transporter;
  return transporter;
};

/**
 * Send a test email to verify the configuration
 */
const sendTestEmail = async (restaurantId) => {
  try {
    console.log(`Sending test email for restaurant ${restaurantId}`);
    
    // Get the restaurant information for the email
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }
    
    const transporter = await getTransporter(restaurantId);
    
    // Make sure we have the sender information
    if (!restaurant.emailConfig?.senderName || !restaurant.emailConfig?.senderEmail) {
      throw new Error('Il nome mittente e l\'email mittente sono obbligatori');
    }
    
    const senderName = restaurant.emailConfig.senderName;
    const senderEmail = restaurant.emailConfig.senderEmail;
    const testRecipient = restaurant.emailConfig.smtpUser; // Send to the restaurant's email for testing
    
    // Send a test email
    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: testRecipient,
      subject: 'Test Email - Configurazione Sistema',
      text: `Questo è un test per verificare la configurazione email del sistema per il ristorante ${restaurant.name}.`,
      html: `<b>Questo è un test per verificare la configurazione email del sistema per il ristorante ${restaurant.name}.</b>`
    });
    
    console.log("Test email sent:", info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error("Test email failed:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

const sendEmail = async (supplierEmail, items, restaurantId) => {
  try {
    console.log(`Attempting to send email to ${supplierEmail} for restaurant ${restaurantId}`);
    
    // Get the restaurant information for the email
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      console.error(`Restaurant not found with ID: ${restaurantId}`);
      throw new Error('Restaurant not found');
    }
    
    // Make sure we have the sender information
    if (!restaurant.emailConfig?.senderName || !restaurant.emailConfig?.senderEmail) {
      throw new Error('Configurazione email incompleta. Il nome mittente e l\'email mittente sono obbligatori.');
    }
    
    const senderName = restaurant.emailConfig.senderName;
    const senderEmail = restaurant.emailConfig.senderEmail;
    
    console.log(`Using sender: ${senderName} <${senderEmail}>`);
    
    // Create items table for email
    const itemsHtml = items.map(item => 
      `<tr>
        <td>${item.name}</td>
        <td>${item.quantity} ${item.unit}</td>
      </tr>`
    ).join('');
    
    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to: supplierEmail,
      subject: 'Nuovo Ordine',
      html: `
        <h2>Richiesta di Nuovo Ordine</h2>
        <p>Si prega di fornire i seguenti articoli:</p>
        <table border="1" cellpadding="5" cellspacing="0">
          <tr>
            <th>Articolo</th>
            <th>Quantità</th>
          </tr>
          ${itemsHtml}
        </table>
        <p>Grazie per il vostro servizio.</p>
        <p>Cordiali saluti,<br>
        ${restaurant.name}</p>
      `
    };

    try {
      const transporter = await getTransporter(restaurantId);
      const info = await transporter.sendMail(mailOptions);
      
      console.log(`Email sent successfully to ${supplierEmail} from ${senderEmail}`);
      console.log("Email message ID:", info.messageId);
      console.log("Email response:", info.response);
      
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendTestEmail,
  verifyEmailCredentials
}; 