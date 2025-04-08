const express = require('express');
const router = express.Router();
const UnitOfMeasure = require('../models/UnitOfMeasure');
const auth = require('../middleware/auth');
const restaurantFilter = require('../middleware/restaurantFilter');

// Apply middleware
router.use(auth);
router.use(restaurantFilter);

// Get all units of measure for a restaurant
router.get('/', async (req, res) => {
  try {
    console.log(`Getting units of measure for restaurant: ${req.restaurantId}`);
    const units = await UnitOfMeasure.find({ restaurantId: req.restaurantId });
    res.json(units);
  } catch (err) {
    console.error('Error getting units of measure:', err);
    res.status(500).json({ message: err.message });
  }
});

// Create a new unit of measure
router.post('/', async (req, res) => {
  try {
    const { name, abbreviation, isDefault } = req.body;
    
    // Validate input
    if (!name || !abbreviation) {
      return res.status(400).json({ message: 'Nome e abbreviazione sono obbligatori' });
    }
    
    // Handle setting default unit
    if (isDefault) {
      // If this unit is being set as default, unset any existing default
      await UnitOfMeasure.updateMany(
        { restaurantId: req.restaurantId, isDefault: true },
        { isDefault: false }
      );
    }
    
    const newUnit = new UnitOfMeasure({
      name,
      abbreviation,
      isDefault: isDefault || false,
      restaurantId: req.restaurantId
    });
    
    const savedUnit = await newUnit.save();
    res.status(201).json(savedUnit);
  } catch (err) {
    // Check for duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Unità di misura già esistente' });
    }
    
    console.error('Error creating unit of measure:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update a unit of measure
router.put('/:id', async (req, res) => {
  try {
    const { name, abbreviation, isDefault } = req.body;
    
    // Validate input
    if (!name || !abbreviation) {
      return res.status(400).json({ message: 'Nome e abbreviazione sono obbligatori' });
    }
    
    // Handle setting default unit
    if (isDefault) {
      // If this unit is being set as default, unset any existing default
      await UnitOfMeasure.updateMany(
        { restaurantId: req.restaurantId, isDefault: true },
        { isDefault: false }
      );
    }
    
    const updatedUnit = await UnitOfMeasure.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId },
      { name, abbreviation, isDefault: isDefault || false },
      { new: true, runValidators: true }
    );
    
    if (!updatedUnit) {
      return res.status(404).json({ message: 'Unità di misura non trovata' });
    }
    
    res.json(updatedUnit);
  } catch (err) {
    // Check for duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Unità di misura già esistente' });
    }
    
    console.error('Error updating unit of measure:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete a unit of measure
router.delete('/:id', async (req, res) => {
  try {
    const deletedUnit = await UnitOfMeasure.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.restaurantId
    });
    
    if (!deletedUnit) {
      return res.status(404).json({ message: 'Unità di misura non trovata' });
    }
    
    res.json({ message: 'Unità di misura eliminata con successo' });
  } catch (err) {
    console.error('Error deleting unit of measure:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 