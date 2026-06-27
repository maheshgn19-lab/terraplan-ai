const mongoose = require('mongoose');

const hydroponicPlotSchema = new mongoose.Schema({
  plotNumber: { type: String, required: true, unique: true },
  zone: { type: String, required: true },
  system: {
    type: String,
    enum: ['DWC', 'NFT', 'Vertical Tower', 'Ebb & Flow', 'Aeroponics', 'Wick'],
    default: 'DWC'
  },
  status: { type: String, enum: ['active', 'idle', 'maintenance', 'harvesting'], default: 'idle' },
  crop: { type: String, default: '' },
  occupant: { type: String, default: null },
  nutrientLevel: { type: Number, min: 0, max: 100, default: 100 }, // percentage
  phLevel: { type: Number, default: 6.5 },
  waterTempC: { type: Number, default: 22 },
  dailyYieldGrams: { type: Number, default: 0 },
  lightsOn: { type: Boolean, default: true },
  notes: { type: String, default: '' },
  lastChecked: { type: Date, default: Date.now },
  plantedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Hydroponic', hydroponicPlotSchema);
