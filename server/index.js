const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const plotRoutes = require('./routes/plots');
const resourceRoutes = require('./routes/resources');
const volunteerRoutes = require('./routes/volunteers');
const announcementRoutes = require('./routes/announcements');
const userRoutes = require('./routes/users');
const weatherRoutes = require('./routes/weather');
const aiRoutes = require('./routes/ai');
const yieldRoutes = require('./routes/yields');
const waterPumpRoutes = require('./routes/waterpumps');
const eventRoutes = require('./routes/events');
const hydroponicRoutes = require('./routes/hydroponics');

app.use('/api/plots', plotRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/yields', yieldRoutes);
app.use('/api/waterpumps', waterPumpRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/hydroponics', hydroponicRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Terraplan AI API 🌿' });
});

// Connect to MongoDB and auto-seed plots
const Plot = require('./models/Plot');

async function seedPlots() {
  const count = await Plot.countDocuments();
  if (count >= 50) return;
  const zones = ['A', 'B', 'C', 'D', 'E'];
  const plots = [];
  for (const zone of zones) {
    for (let n = 1; n <= 10; n++) {
      plots.push({ plotNumber: `${zone}${n}`, zone: `Zone ${zone}`, status: 'free' });
    }
  }
  await Plot.insertMany(plots);
  console.log('✅ Auto-seeded 50 plots');
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected 🌿');
    await seedPlots();
  })
  .catch(err => console.log(err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Terraplan AI server running on port ${PORT} 🚀`);
});