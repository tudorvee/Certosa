const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  items: [
    {
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      customUnit: {
        type: String,
        default: null,
        description: "Custom unit of measure selected for this item, overrides the default unit"
      }
    }
  ],
  orderDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'pending'
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  supplierNotes: {
    type: Map,
    of: String,
    default: new Map(),
    description: "Notes for each supplier, keyed by supplier ID"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema); 