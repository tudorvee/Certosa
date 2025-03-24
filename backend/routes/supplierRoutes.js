const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const auth = require('../middleware/auth');
const { isAdmin, isKitchen } = require('../middleware/roleAuth');
const restaurantFilter = require('../middleware/restaurantFilter');

// Apply auth to all routes
router.use(auth);
router.use(isKitchen); // Make sure kitchen staff can access suppliers
router.use(restaurantFilter);

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    console.log('GET /suppliers - User role:', req.user?.role);
    console.log('GET /suppliers - Restaurant ID:', req.restaurantId);
    console.log('GET /suppliers - Query params:', req.query);
    console.log('GET /suppliers - Headers:', req.headers['x-restaurant-id']);
    
    // Force filtering by restaurant ID
    if (!req.restaurantId) {
      console.log('No restaurant ID provided, returning empty results');
      return res.json([]);
    }
    
    // Always filter by the restaurant ID
    const query = { restaurantId: req.restaurantId };
    console.log('Supplier query:', query);
    
    const suppliers = await Supplier.find(query).sort({ name: 1 });
    console.log(`Found ${suppliers.length} suppliers for restaurant ${req.restaurantId}`);
    
    res.json(suppliers);
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add a new supplier (only admin can do this)
router.post('/', isAdmin, async (req, res) => {
  try {
    if (!req.restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }
    
    // Add restaurant ID to the supplier
    const supplier = new Supplier({
      ...req.body,
      restaurantId: req.restaurantId
    });
    
    console.log('Creating supplier with data:', supplier);
    const newSupplier = await supplier.save();
    console.log('Supplier created successfully:', newSupplier);
    res.status(201).json(newSupplier);
  } catch (err) {
    console.error('Error creating supplier:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update a supplier (only admin can do this)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    if (!req.restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }
    
    // Ensure we're only updating suppliers from the current restaurant
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId },
      req.body,
      { new: true }
    );
    
    if (!supplier) {
      return res.status(404).json({ message: 'Fornitore non trovato' });
    }
    
    res.json(supplier);
  } catch (err) {
    console.error('Error updating supplier:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete a supplier (only admin can do this)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    if (!req.restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }
    
    console.log('DELETE supplier - params:', req.params);
    console.log('DELETE supplier - restaurant ID:', req.restaurantId);
    
    // Ensure we're only deleting suppliers from the current restaurant
    const supplier = await Supplier.findOneAndDelete({ 
      _id: req.params.id, 
      restaurantId: req.restaurantId 
    });
    
    if (!supplier) {
      return res.status(404).json({ message: 'Fornitore non trovato' });
    }
    
    res.json({ message: 'Fornitore eliminato con successo' });
  } catch (err) {
    console.error('Error deleting supplier:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 