const express = require('express');
const router = express.Router();
const Yield = require('../models/Yield');

// Get all yields
router.get('/', async (req, res) => {
  try {
    const yields = await Yield.find().sort({ harvestDate: -1 });
    res.json(yields);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get yield stats
router.get('/stats', async (req, res) => {
  try {
    const yields = await Yield.find();
    const totalExpected = yields.reduce((sum, y) => sum + y.expectedYield, 0);
    const totalActual = yields.reduce((sum, y) => sum + y.actualYield, 0);
    const successRate = totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 0;
    const topCrop = yields.reduce((acc, y) => {
      acc[y.cropName] = (acc[y.cropName] || 0) + y.actualYield;
      return acc;
    }, {});
    const topCropName = Object.keys(topCrop).sort((a, b) => topCrop[b] - topCrop[a])[0];
    res.json({ totalExpected, totalActual, successRate, topCrop: topCropName || 'None', totalEntries: yields.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create yield
router.post('/', async (req, res) => {
  try {
    const yieldEntry = new Yield(req.body);
    const newYield = await yieldEntry.save();
    res.status(201).json(newYield);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update yield
router.put('/:id', async (req, res) => {
  try {
    const yieldEntry = await Yield.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(yieldEntry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete yield
router.delete('/:id', async (req, res) => {
  try {
    await Yield.findByIdAndDelete(req.params.id);
    res.json({ message: 'Yield entry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;