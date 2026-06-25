const express = require('express');
const router = express.Router();
const Plot = require('../models/plot');

// Get all plots
router.get('/', async (req, res) => {
  try {
    const plots = await Plot.find();
    res.json(plots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single plot
router.get('/:id', async (req, res) => {
  try {
    const plot = await Plot.findById(req.params.id);
    res.json(plot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create plot
router.post('/', async (req, res) => {
  try {
    const plot = new Plot(req.body);
    const newPlot = await plot.save();
    res.status(201).json(newPlot);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update plot
router.put('/:id', async (req, res) => {
  try {
    const plot = await Plot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(plot);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete plot
router.delete('/:id', async (req, res) => {
  try {
    await Plot.findByIdAndDelete(req.params.id);
    res.json({ message: 'Plot deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;