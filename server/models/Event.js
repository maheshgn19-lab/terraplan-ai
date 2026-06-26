const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  region: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    default: 'regional'
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
