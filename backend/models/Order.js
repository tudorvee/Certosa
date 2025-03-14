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
  }
});

module.exports = mongoose.model('Order', OrderSchema); 