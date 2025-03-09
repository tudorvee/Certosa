const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Item = require('../models/Item');
const Supplier = require('../models/Supplier');
const sendEmail = require('../utils/emailService');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().populate({
      path: 'items.itemId',
      populate: { path: 'supplierId' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new order
router.post('/', async (req, res) => {
  try {
    const order = new Order(req.body);
    const savedOrder = await order.save();
    
    // Group items by supplier
    const supplierItems = {};
    
    for (const orderItem of req.body.items) {
      const item = await Item.findById(orderItem.itemId).populate('supplierId');
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
    }
    
    // Send email to each supplier
    for (const supplierId in supplierItems) {
      const { supplier, items } = supplierItems[supplierId];
      await sendEmail(supplier.email, items);
    }
    
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router; 