const mongoose = require('mongoose');

const yieldSchema = new mongoose.Schema({
  plotNumber: { type: String, required: true },
  zone: { type: String, required: true },
  cropName: { type: String, required: true },
  expectedYield: { type: Number, required: true },
  actualYield: { type: Number, default: 0 },
  unit: { type: String, enum: ['kg', 'g', 'pieces', 'bunches'], default: 'kg' },
  harvestDate: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  season: { type: String, default: 'Spring 2026' },
}, { timestamps: true });

module.exports = mongoose.model('Yield', yieldSchema);