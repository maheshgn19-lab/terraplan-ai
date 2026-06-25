const mongoose = require('mongoose');

const plotSchema = new mongoose.Schema({
  plotNumber: { type: String, required: true },
  zone: { type: String, required: true },
  status: { type: String, enum: ['free', 'taken', 'reserved', 'mine'], default: 'free' },
  occupant: { type: String, default: null },
  crops: [{ type: String }],
  bookedAt: { type: Date, default: null },
  soilStatus: { type: String, enum: ['dry', 'moist', 'wet'], default: 'dry' },
  lastWatered: { type: Date, default: null },
  soilNotes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Plot', plotSchema);