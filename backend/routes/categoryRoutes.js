const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const { isAdmin, isKitchen } = require('../middleware/roleAuth');
const restaurantFilter = require('../middleware/restaurantFilter');

// Apply auth to all routes
router.use(auth);
router.use(isKitchen); // Kitchen staff can view categories
router.use(restaurantFilter);

// Get all categories for the current restaurant
router.get('/', async (req, res) => {
  try {
    console.log('GET /categories - Restaurant ID:', req.restaurantId);
    
    // Force filtering by restaurant ID
    if (!req.restaurantId) {
      console.log('No restaurant ID provided, returning empty results');
      return res.json([]);
    }
    
    // Always filter by the restaurant ID
    const query = { restaurantId: req.restaurantId };
    console.log('Category query:', query);
    
    const categories = await Category.find(query).sort({ name: 1 });
    console.log(`Found ${categories.length} categories for restaurant ${req.restaurantId}`);
    
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get a specific category
router.get('/:id', async (req, res) => {
  try {
    if (!req.restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }
    
    const category = await Category.findOne({
      _id: req.params.id,
      restaurantId: req.restaurantId
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Categoria non trovata' });
    }
    
    res.json(category);
  } catch (err) {
    console.error('Error fetching category:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add a new category (admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    if (!req.restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }
    
    // Add restaurant ID to the category
    const category = new Category({
      ...req.body,
      restaurantId: req.restaurantId
    });
    
    console.log('Creating category with data:', category);
    const newCategory = await category.save();
    console.log('Category created successfully:', newCategory);
    
    res.status(201).json(newCategory);
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update a category (admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    if (!req.restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }
    
    // Ensure we're only updating categories from the current restaurant
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId },
      req.body,
      { new: true }
    );
    
    if (!category) {
      return res.status(404).json({ message: 'Categoria non trovata' });
    }
    
    res.json(category);
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete a category (admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    if (!req.restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }
    
    // Check if there are items using this category
    const Item = require('../models/Item');
    const itemCount = await Item.countDocuments({ 
      categoryId: req.params.id,
      restaurantId: req.restaurantId
    });
    
    if (itemCount > 0) {
      return res.status(400).json({ 
        message: `Impossibile eliminare la categoria: è utilizzata da ${itemCount} articoli` 
      });
    }
    
    // Ensure we're only deleting categories from the current restaurant
    const category = await Category.findOneAndDelete({ 
      _id: req.params.id, 
      restaurantId: req.restaurantId 
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Categoria non trovata' });
    }
    
    res.json({ message: 'Categoria eliminata con successo' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 