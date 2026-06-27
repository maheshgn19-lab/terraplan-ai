const express = require('express');
const router = express.Router();
const Hydroponic = require('../models/Hydroponic');

// GET all hydroponic plots
router.get('/', async (req, res) => {
  try {
    const plots = await Hydroponic.find().sort({ plotNumber: 1 });
    res.json(plots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single plot
router.get('/:id', async (req, res) => {
  try {
    const plot = await Hydroponic.findById(req.params.id);
    if (!plot) return res.status(404).json({ message: 'Plot not found' });
    res.json(plot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE a hydroponic plot
router.post('/', async (req, res) => {
  try {
    const plot = new Hydroponic(req.body);
    const saved = await plot.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE a hydroponic plot
router.put('/:id', async (req, res) => {
  try {
    const updated = await Hydroponic.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastChecked: new Date() },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// LOG daily yield
router.put('/:id/yield', async (req, res) => {
  try {
    const { grams } = req.body;
    const plot = await Hydroponic.findByIdAndUpdate(
      req.params.id,
      { dailyYieldGrams: Number(grams), lastChecked: new Date() },
      { new: true }
    );
    res.json(plot);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a hydroponic plot
router.delete('/:id', async (req, res) => {
  try {
    await Hydroponic.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hydroponic plot removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SEED default 10 hydroponic plots (Zone H1, 10 plots)
router.post('/seed', async (req, res) => {
  try {
    const existing = await Hydroponic.find({}, 'plotNumber');
    const existingNums = new Set(existing.map(p => p.plotNumber));
    const crops = ['Lettuce', 'Basil', 'Spinach', 'Kale', 'Tomato', 'Mint', 'Cilantro', 'Arugula', 'Chard', 'Cucumber'];
    const toInsert = [];
    for (let n = 1; n <= 10; n++) {
      const num = `H1-P${n}`;
      if (!existingNums.has(num)) {
        toInsert.push({
          plotNumber: num,
          zone: 'Zone H1',
          system: 'DWC',
          crop: crops[n - 1],
          status: 'idle',
          nutrientLevel: Math.floor(Math.random() * 40) + 60,
          phLevel: +(5.5 + Math.random() * 2).toFixed(1),
          waterTempC: +(20 + Math.random() * 5).toFixed(1),
        });
      }
    }
    if (toInsert.length > 0) await Hydroponic.insertMany(toInsert);
    const total = await Hydroponic.countDocuments();
    res.json({ message: `Seeded ${toInsert.length} hydroponic plots`, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
