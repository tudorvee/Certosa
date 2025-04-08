const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Item = require('../models/Item');
const Supplier = require('../models/Supplier');
const Restaurant = require('../models/Restaurant');
const emailService = require('../utils/emailService');
const auth = require('../middleware/auth');
const { isKitchen } = require('../middleware/roleAuth');
const restaurantFilter = require('../middleware/restaurantFilter');

// EMERGENCY TEST ROUTE - REMOVE AFTER DEBUGGING
// This must be before the middleware to bypass auth
router.post('/emergency-test-note', async (req, res) => {
  try {
    console.log('EMERGENCY TEST: Testing note email functionality');
    console.log('Request body:', req.body);
    
    // Find a restaurant with email config
    const restaurant = await Restaurant.findOne({ 'emailConfig.senderEmail': { $exists: true } });
    if (!restaurant) {
      return res.status(400).json({ 
        success: false, 
        message: 'No restaurant with email configuration found'
      });
    }
    
    // Find a supplier
    const supplier = await Supplier.findOne({ restaurantId: restaurant._id });
    if (!supplier || !supplier.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'No supplier with email found'
      });
    }
    
    // Generate test HTML directly
    const testHtml = `
      <h2>EMERGENCY TEST Email</h2>
      <p>This is a direct test of the email system with notes.</p>
      <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #0d6efd;">
        <p><strong>Test Note:</strong></p>
        <p>${req.body.note || "Default test note - no note was provided in the request"}</p>
      </div>
      <p>Timestamp: ${new Date().toISOString()}</p>
      <p>Test ID: ${Math.random().toString(36).substring(2, 15)}</p>
    `;
    
    const transporter = await emailService.getTransporter(restaurant._id);
    const info = await transporter.sendMail({
      from: `"${restaurant.emailConfig.senderName}" <${restaurant.emailConfig.senderEmail}>`,
      to: supplier.email,
      subject: 'EMERGENCY TEST Email with Note',
      html: testHtml
    });
    
    res.json({ 
      success: true, 
      message: 'Emergency test email sent', 
      to: supplier.email,
      messageId: info.messageId,
      emailContent: testHtml
    });
  } catch (err) {
    console.error('Error in emergency test:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Add a simple test route that doesn't require authentication 
// This must be before the middleware to bypass auth
router.get('/test-email', async (req, res) => {
  try {
    console.log('🧪 Testing email functionality');
    
    // Create transporter directly
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Log authentication details (sanitized)
    console.log('Using email credentials:');
    console.log(`- Username: ${process.env.EMAIL_USER}`);
    console.log(`- Password: ${process.env.EMAIL_PASS ? '*'.repeat(8) : 'not set'}`);
    
    // Verify connection configuration
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      return res.status(500).json({
        success: false,
        message: 'SMTP verification failed',
        error: verifyError.message
      });
    }
    
    // Simple test email
    const info = await transporter.sendMail({
      from: `"Email Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'Test Email ' + new Date().toISOString(),
      text: 'This is a test email to verify email functionality is working.',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email sent at ${new Date().toLocaleString()}.</p>
        <p>If you're receiving this, email sending is working correctly!</p>
      `
    });
    
    console.log('Test email sent successfully:', info.messageId);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// Apply auth and middleware to all routes
router.use(auth);
router.use(restaurantFilter);

// Get all orders
router.get('/', isKitchen, async (req, res) => {
  try {
    // Get orders for the current restaurant
    const orders = await Order.find({ restaurantId: req.restaurantId })
      .populate({
        path: 'items.itemId',
        populate: { path: 'supplierId' }
      })
      .sort({ orderDate: -1 });
      
    res.json(orders);
  } catch (err) {
    console.error('Error getting orders:', err);
    res.status(500).json({ message: err.message });
  }
});

// Test email route
router.post('/test-email', isKitchen, async (req, res) => {
  try {
    console.log('Testing email configuration for restaurant:', req.restaurantId);
    
    // Get restaurant info first
    const restaurant = await Restaurant.findById(req.restaurantId);
    if (!restaurant) {
      console.error('Restaurant not found:', req.restaurantId);
      return res.status(400).json({ 
        success: false, 
        message: 'Restaurant not found',
        error: 'Restaurant configuration not found'
      });
    }
    
    console.log('Found restaurant:', restaurant.name);
    console.log('Email config:', {
      senderName: restaurant.emailConfig?.senderName,
      senderEmail: restaurant.emailConfig?.senderEmail,
      smtpHost: restaurant.emailConfig?.smtpHost,
      smtpPort: restaurant.emailConfig?.smtpPort,
      smtpUser: restaurant.emailConfig?.smtpUser,
      useSsl: restaurant.emailConfig?.useSsl
    });
    
    const result = await emailService.sendTestEmail(req.restaurantId);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test email sent successfully', 
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Test email failed', 
        error: result.error 
      });
    }
  } catch (err) {
    console.error('Error testing email:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error testing email', 
      error: err.message 
    });
  }
});

// Create a new order with better error handling
router.post('/', isKitchen, async (req, res) => {
  try {
    console.log("Order request received:", req.body);
    console.log("Supplier notes received:", req.body.supplierNotes);
    
    const { items = [], supplierNotes = {} } = req.body;
    
    // Validate that we have either items or supplier notes
    const hasItems = Array.isArray(items) && items.length > 0;
    const hasNotes = Object.values(supplierNotes).some(note => note && note.trim());
    
    if (!hasItems && !hasNotes) {
      return res.status(400).json({ message: 'L\'ordine deve contenere almeno un articolo o una nota' });
    }
    
    const order = new Order({
      restaurantId: req.user.restaurantId,
      items: items.map(item => ({
        itemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        customUnit: item.customUnit || null, // Handle custom unit if provided
        supplierId: item.supplierId
      })),
      supplierNotes,
      createdBy: req.user._id
    });
    
    const savedOrder = await order.save();
    console.log("Order saved:", savedOrder);
    
    // Initialize an object to group items by supplier for emails
    const supplierItems = {};
    const emailErrors = [];
    
    // Only process items if they exist
    if (hasItems) {
      console.log("Processing order items with units:");
      items.forEach(item => {
        console.log(`- Item: ${item.name}, Quantity: ${item.quantity}, Original Unit: ${item.unit}, Custom Unit: ${item.customUnit || 'N/A'}`);
      });
      
      // Group items by supplier
      for (const item of items) {
        try {
          // Get the full item details from the database
          const dbItem = await Item.findById(item.itemId).populate('supplierId');
          
          if (!dbItem) {
            console.error(`Item not found: ${item.itemId}`);
            continue;
          }
          
          if (!dbItem.supplierId) {
            console.error(`Item ${dbItem.name} has no supplier`);
            continue;
          }
          
          const supplierId = dbItem.supplierId._id.toString();
          
          // Initialize the supplier group if not exists
          if (!supplierItems[supplierId]) {
            supplierItems[supplierId] = {
              supplier: dbItem.supplierId,
              items: []
            };
          }
          
          // Add the item to its supplier's group
          supplierItems[supplierId].items.push({
            name: dbItem.name,
            quantity: item.quantity,
            unit: dbItem.unit,
            customUnit: item.customUnit
          });
        } catch (err) {
          console.error(`Error processing item ${item.itemId}:`, err);
        }
      }
    }
    
    // Send email to each supplier
    for (const supplierId in supplierItems) {
      const { supplier, items } = supplierItems[supplierId];
      
      if (!supplier.email) {
        console.error(`Supplier ${supplier.name} has no email`);
        emailErrors.push(`Nessuna email configurata per ${supplier.name}`);
        continue;
      }
      
      try {
        console.log(`Sending email to supplier ${supplier.name} <${supplier.email}>`);
        console.log('Supplier ID:', supplierId);
        
        // Get the note for this supplier
        let supplierNote = null;
        if (supplierNotes && typeof supplierNotes === 'object') {
          supplierNote = supplierNotes[supplierId];
          console.log('Found note for supplier:', supplierNote);
        }
        
        // Use the emailService to send the email
        try {
          console.log(`Using emailService to send email to ${supplier.name} <${supplier.email}>`);
          
          const emailResult = await emailService.sendEmail(
            supplier.email,
            items,
            req.restaurantId,
            supplierNote
          );
          
          if (emailResult.success) {
            console.log(`Email sent successfully to ${supplier.name} with messageId: ${emailResult.messageId}`);
          } else {
            throw new Error(`Failed to send email: ${emailResult.error}`);
          }
        } catch (emailErr) {
          console.error(`Error sending email to ${supplier.email}:`, emailErr);
          emailErrors.push(`Errore nell'invio dell'email a ${supplier.name}: ${emailErr.message}`);
        }
      } catch (err) {
        console.error(`Error sending email to ${supplier.email}:`, err);
        emailErrors.push(`Errore nell'invio dell'email a ${supplier.name}: ${err.message}`);
      }
    }
    
    // Now handle note-only emails (no items)
    if (supplierNotes && typeof supplierNotes === 'object') {
      // Find suppliers that have notes but no items already processed
      const processedSupplierIds = new Set(Object.keys(supplierItems));
      
      for (const [supplierId, note] of Object.entries(supplierNotes)) {
        // Skip if we already processed this supplier above
        if (processedSupplierIds.has(supplierId) || !note?.trim()) {
          continue;
        }
        
        try {
          // Find the supplier
          const supplier = await Supplier.findById(supplierId);
          if (!supplier || !supplier.email) {
            console.error(`Supplier ${supplierId} not found or has no email`);
            emailErrors.push(`Nessuna email configurata per ${supplier?.name || 'fornitore sconosciuto'}`);
            continue;
          }
          
          console.log(`Sending note-only email to supplier ${supplier.name} <${supplier.email}>`);
          
          // Send email with just the note, no items
          const emailResult = await emailService.sendEmail(
            supplier.email,
            [], // Empty items array
            req.restaurantId,
            note.trim()
          );
          
          if (emailResult.success) {
            console.log(`Note-only email sent successfully to ${supplier.name} with messageId: ${emailResult.messageId}`);
          } else {
            throw new Error(`Failed to send note-only email: ${emailResult.error}`);
          }
        } catch (err) {
          console.error(`Error sending note-only email to supplier ${supplierId}:`, err);
          const supplierName = await Supplier.findById(supplierId).then(s => s?.name || 'fornitore sconosciuto');
          emailErrors.push(`Errore nell'invio dell'email a ${supplierName}: ${err.message}`);
        }
      }
    }
    
    // Return appropriate response based on email success
    if (emailErrors.length > 0) {
      console.log('Order created but with email errors:', emailErrors);
      res.status(201).json({ 
        order: savedOrder,
        message: 'Ordine creato ma con errori nell\'invio delle email',
        emailErrors
      });
    } else {
      console.log('Order created successfully with all emails sent');
      res.status(201).json({ 
        order: savedOrder,
        message: 'Ordine creato con successo e tutte le email inviate'
      });
    }
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(400).json({ message: err.message });
  }
});

// Add a new test route for notes
router.post('/test-note-email', isKitchen, async (req, res) => {
  try {
    console.log('Testing note email functionality for restaurant:', req.restaurantId);
    console.log('Request body:', req.body);
    
    // Get supplier to send to
    const supplier = await Supplier.findOne({ restaurantId: req.restaurantId });
    if (!supplier || !supplier.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'No supplier with email found'
      });
    }
    
    // Send test email with note
    const result = await emailService.sendBasicEmail(
      supplier.email,
      req.restaurantId,
      req.body.note || "Questa è una nota di test!"
    );
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test email with note sent successfully', 
        messageId: result.messageId,
        supplierEmail: supplier.email
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Test email with note failed', 
        error: result.error 
      });
    }
  } catch (err) {
    console.error('Error testing note email:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error testing note email', 
      error: err.message 
    });
  }
});

// Simplified emergency note test
router.post('/emergency-note', isKitchen, async (req, res) => {
  try {
    console.log('🔴 DIRECT TEST: Testing note email with simplified approach');
    console.log('Request body:', req.body);
    
    // Find a supplier to send to
    const supplier = await Supplier.findOne({ restaurantId: req.restaurantId });
    if (!supplier || !supplier.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'No supplier with email found for this restaurant'
      });
    }
    
    // Get restaurant info
    const restaurant = await Restaurant.findById(req.restaurantId);
    if (!restaurant) {
      return res.status(400).json({ 
        success: false, 
        message: 'Restaurant not found' 
      });
    }
    
    // Create email content
    const noteText = req.body.note || "This is a default test note";
    const htmlContent = `
      <h2>TEST EMAIL - Verifica Note</h2>
      <p>Questo è un test per la funzionalità delle note negli ordini.</p>
      <hr>
      <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #0d6efd;">
        <p><strong>Nota di Test:</strong></p>
        <p>${noteText}</p>
      </div>
      <hr>
      <p>Timestamp: ${new Date().toISOString()}</p>
      <p>Ristorante: ${restaurant.name}</p>
    `;
    
    // Create nodemailer transporter
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || restaurant.emailConfig.senderEmail,
        pass: process.env.EMAIL_PASS || restaurant.emailConfig.smtpPassword
      }
    });
    
    // Send email
    console.log(`Sending test email to ${supplier.email}`);
    const info = await transporter.sendMail({
      from: `"${restaurant.name} - TEST" <${restaurant.emailConfig.senderEmail}>`,
      to: supplier.email,
      subject: 'TEST - Verifica Note Ordini',
      html: htmlContent
    });
    
    console.log('Email sent:', info.messageId);
    
    // Return success
    res.json({
      success: true,
      message: 'Test email sent successfully',
      to: supplier.email,
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error sending test email'
    });
  }
});

module.exports = router; 