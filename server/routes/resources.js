const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');

// Get all resources
router.get('/', async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single resource
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    res.json(resource);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create resource
router.post('/', async (req, res) => {
  try {
    const resource = new Resource(req.body);
    const newResource = await resource.save();
    res.status(201).json(newResource);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Borrow resource
router.put('/:id/borrow', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (resource.availableQuantity <= 0) {
      return res.status(400).json({ message: 'No resources available' });
    }
    resource.availableQuantity -= 1;
    resource.borrowedBy.push(req.body.name);
    await resource.save();
    res.json(resource);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Return resource
router.put('/:id/return', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    resource.availableQuantity += 1;
    resource.borrowedBy = resource.borrowedBy.filter(name => name !== req.body.name);
    await resource.save();
    res.json(resource);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete resource
router.delete('/:id', async (req, res) => {
  try {
    await Resource.findByIdAndDelete(req.params.id);
    res.json({ message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;