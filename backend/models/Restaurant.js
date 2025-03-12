const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  email: {
    type: String
  },
  emailConfig: {
    senderName: {
      type: String,
      default: ''
    },
    senderEmail: {
      type: String,
      default: ''
    },
    smtpHost: {
      type: String,
      default: 'smtp.gmail.com'
    },
    smtpPort: {
      type: Number,
      default: 587
    },
    smtpUser: {
      type: String,
      default: ''
    },
    smtpPassword: {
      type: String,
      default: ''
    },
    useSsl: {
      type: Boolean,
      default: false
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Restaurant', RestaurantSchema); 