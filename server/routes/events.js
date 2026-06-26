const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Holidays = require('date-holidays');

// Get all events (combines government holidays and regional events)
router.get('/', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), country = 'IN' } = req.query;
    
    // 1. Get Government Holidays
    const hd = new Holidays(country);
    const holidays = hd.getHolidays(year);
    
    const formattedHolidays = holidays.map(h => ({
      _id: `holiday-${h.date.split(' ')[0]}-${h.name}`,
      title: h.name,
      date: new Date(h.date),
      type: 'holiday',
      region: country,
      description: h.type
    }));

    // 2. Get Regional Events from Database
    const regionalEvents = await Event.find().sort({ date: 1 });

    // Combine and return
    res.json([...formattedHolidays, ...regionalEvents]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new regional event
router.post('/', async (req, res) => {
  try {
    const newEvent = new Event({
      title: req.body.title,
      date: req.body.date,
      region: req.body.region,
      description: req.body.description,
      type: 'regional'
    });
    
    const savedEvent = await newEvent.save();
    res.json(savedEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
