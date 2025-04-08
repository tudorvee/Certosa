const mongoose = require('mongoose');

const UnitOfMeasureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  abbreviation: {
    type: String,
    required: true,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  }
}, { timestamps: true });

// Ensure uniqueness of name and abbreviation within a restaurant
UnitOfMeasureSchema.index({ name: 1, restaurantId: 1 }, { unique: true });
UnitOfMeasureSchema.index({ abbreviation: 1, restaurantId: 1 }, { unique: true });

module.exports = mongoose.model('UnitOfMeasure', UnitOfMeasureSchema); 