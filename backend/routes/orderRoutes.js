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
    // Validate input
    if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({ message: 'Nessun articolo fornito per l\'ordine' });
    }
    
    // Get restaurant info
    console.log('Creating order for restaurant:', req.restaurantId);
    const restaurant = await Restaurant.findById(req.restaurantId);
    if (!restaurant) {
      return res.status(400).json({ message: 'Ristorante non trovato' });
    }
    
    // Create the order with restaurant ID
    const order = new Order({
      items: req.body.items,
      restaurantId: req.restaurantId
    });
    
    // Save the order first
    const savedOrder = await order.save();
    console.log('Order saved to database:', savedOrder._id);
    
    // Group items by supplier
    const supplierItems = {};
    const emailErrors = [];
    
    // Collect item details and group by supplier
    for (const orderItem of req.body.items) {
      try {
        const item = await Item.findById(orderItem.itemId).populate('supplierId');
        if (!item) {
          console.error(`Item not found: ${orderItem.itemId}`);
          continue;
        }
        
        if (!item.supplierId) {
          console.error(`Supplier not found for item: ${item.name}`);
          continue;
        }
        
        const supplierId = item.supplierId._id.toString();
        
        if (!supplierItems[supplierId]) {
          supplierItems[supplierId] = {
            supplier: item.supplierId,
            items: []
          };
        }
        
        supplierItems[supplierId].items.push({
          name: item.name,
          quantity: orderItem.quantity,
          unit: item.unit
        });
      } catch (err) {
        console.error(`Error processing order item ${orderItem.itemId}:`, err);
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
        const emailResult = await emailService.sendEmail(supplier.email, items, req.restaurantId);
        
        if (emailResult.success) {
          console.log(`Email sent to ${supplier.name} with message ID: ${emailResult.messageId}`);
        } else {
          throw new Error('Email sending failed');
        }
      } catch (err) {
        console.error(`Error sending email to ${supplier.email}:`, err);
        emailErrors.push(`Errore nell'invio dell'email a ${supplier.name}: ${err.message}`);
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

module.exports = router; 