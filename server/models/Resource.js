const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  emoji: { type: String, default: '🔧' },
  totalQuantity: { type: Number, required: true },
  availableQuantity: { type: Number, required: true },
  category: { type: String, enum: ['tool', 'seed', 'equipment'], default: 'tool' },
  borrowedBy: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);