const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const auth = require('../middleware/auth');
const { isAdmin, isKitchen } = require('../middleware/roleAuth');
const restaurantFilter = require('../middleware/restaurantFilter');

// Apply auth to all routes
router.use(auth);
router.use(isKitchen); // Make sure kitchen staff can access items
router.use(restaurantFilter);

// Get all items
router.get('/', async (req, res) => {
  try {
    console.log('GET /items - User role:', req.user?.role);
    console.log('GET /items - Restaurant ID:', req.restaurantId);
    console.log('GET /items - Query params:', req.query);
    console.log('GET /items - Headers:', req.headers['x-restaurant-id']);
    
    // Force filtering by restaurant ID
    if (!req.restaurantId) {
      console.log('No restaurant ID provided, returning empty results');
      return res.json([]);
    }
    
    // Always filter by the restaurant ID
    const query = { restaurantId: req.restaurantId };
    
    // Filter by category if provided
    if (req.query.categoryId) {
      query.categoryId = req.query.categoryId;
      console.log('Filtering by category:', req.query.categoryId);
    }
    
    // Filter by supplier if provided
    if (req.query.supplierId) {
      query.supplierId = req.query.supplierId;
      console.log('Filtering by supplier:', req.query.supplierId);
    }
    
    console.log('Item query:', query);
    
    const items = await Item.find(query)
      .populate('supplierId')
      .populate('categoryId')
      .sort({ name: 1 });
    
    console.log(`Found ${items.length} items for restaurant ${req.restaurantId}`);
    
    res.json(items);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get a specific item
router.get('/:id', async (req, res) => {
  try {
    if (!req.restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }
    
    // Always filter by the restaurant ID
    const query = { 
      _id: req.params.id,
      restaurantId: req.restaurantId 
    };
    
    const item = await Item.findOne(query)
      .populate('supplierId')
      .populate('categoryId');
    
    if (!item) {
      return res.status(404).json({ message: 'Articolo non trovato' });
    }
    
    res.json(item);
  } catch (err) {
    console.error('Error fetching item:', err);
    res.status(500).json({ message: err.message });
  }
});

// Create a new item (only admin can do this)
router.post('/', isAdmin, async (req, res) => {
  try {
    if (!req.restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }
    
    // Always add restaurant ID to the item
    const item = new Item({
      ...req.body,
      restaurantId: req.restaurantId
    });
    
    // Validate that supplier belongs to this restaurant
    const Supplier = require('../models/Supplier');
    const supplier = await Supplier.findOne({ 
      _id: req.body.supplierId,
      restaurantId: req.restaurantId
    });
    
    if (!supplier) {
      return res.status(400).json({ 
        message: 'Il fornitore selezionato non appartiene a questo ristorante' 
      });
    }
    
    // Validate category if provided
    if (req.body.categoryId) {
      const Category = require('../models/Category');
      const category = await Category.findOne({
        _id: req.body.categoryId,
        restaurantId: req.restaurantId
      });
      
      if (!category) {
        return res.status(400).json({
          message: 'La categoria selezionata non appartiene a questo ristorante'
        });
      }
    }
    
    console.log('Creating item with data:', item);
    const newItem = await item.save();
    
    // Populate supplier and category data
    const populatedItem = await Item.findById(newItem._id)
      .populate('supplierId')
      .populate('categoryId');
    
    console.log('Item created successfully');
    
    res.status(201).json(populatedItem);
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update an item (only admin can do this)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    if (!req.restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }
    
    // If supplier is being changed, validate it
    if (req.body.supplierId) {
      const Supplier = require('../models/Supplier');
      const supplier = await Supplier.findOne({ 
        _id: req.body.supplierId,
        restaurantId: req.restaurantId
      });
      
      if (!supplier) {
        return res.status(400).json({ 
          message: 'Il fornitore selezionato non appartiene a questo ristorante' 
        });
      }
    }
    
    // If category is being changed, validate it
    if (req.body.categoryId) {
      const Category = require('../models/Category');
      const category = await Category.findOne({
        _id: req.body.categoryId,
        restaurantId: req.restaurantId
      });
      
      if (!category) {
        return res.status(400).json({
          message: 'La categoria selezionata non appartiene a questo ristorante'
        });
      }
    }
    
    // Ensure we're only updating items from the current restaurant
    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId },
      req.body,
      { new: true }
    )
    .populate('supplierId')
    .populate('categoryId');
    
    if (!item) {
      return res.status(404).json({ message: 'Articolo non trovato' });
    }
    
    res.json(item);
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete an item (only admin can do this)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    if (!req.restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }
    
    // Ensure we're only deleting items from the current restaurant
    const item = await Item.findOneAndDelete({ 
      _id: req.params.id, 
      restaurantId: req.restaurantId 
    });
    
    if (!item) {
      return res.status(404).json({ message: 'Articolo non trovato' });
    }
    
    res.json({ message: 'Articolo eliminato con successo' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 