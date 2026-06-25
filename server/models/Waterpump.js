const mongoose = require('mongoose');

const waterPumpSchema = new mongoose.Schema({
  pumpId: { type: String, required: true },
  name: { type: String, required: true },
  zone: { type: String, required: true },
  location: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
  nearbyPlots: [{ type: String }],
  dailyUsage: { type: Number, default: 0 },
  totalUsage: { type: Number, default: 0 },
  lastUsed: { type: Date, default: null },
  capacity: { type: Number, default: 1000 },
}, { timestamps: true });

module.exports = mongoose.model('WaterPump', waterPumpSchema);