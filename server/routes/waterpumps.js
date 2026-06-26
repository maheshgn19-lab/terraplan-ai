const express = require('express');
const router = express.Router();
const WaterPump = require('../models/Waterpump');

// Get all pumps
router.get('/', async (req, res) => {
  try {
    const pumps = await WaterPump.find();
    res.json(pumps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create pump
router.post('/', async (req, res) => {
  try {
    const pump = new WaterPump(req.body);
    const newPump = await pump.save();
    res.status(201).json(newPump);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update pump usage
router.put('/:id/use', async (req, res) => {
  try {
    const pump = await WaterPump.findById(req.params.id);
    pump.dailyUsage += req.body.litres || 0;
    pump.totalUsage += req.body.litres || 0;
    pump.lastUsed = new Date();
    await pump.save();
    res.json(pump);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update pump status
router.put('/:id', async (req, res) => {
  try {
    const pump = await WaterPump.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(pump);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete pump
router.delete('/:id', async (req, res) => {
  try {
    await WaterPump.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pump deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset daily usage
router.post('/reset-daily', async (req, res) => {
  try {
    await WaterPump.updateMany({}, { dailyUsage: 0 });
    res.json({ message: 'Daily usage reset!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;