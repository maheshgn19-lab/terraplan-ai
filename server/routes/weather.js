const express = require('express');
const router = express.Router();
const axios = require('axios');

const WEATHER_API_KEY = '232a66fe04a5e669c14df10e3ebd0f9f';
const CITY = 'Chennai';

// Get current weather
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric`
    );
    const data = response.data;
    res.json({
      city: data.name,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: data.wind.speed,
      pressure: data.main.pressure,
      visibility: data.visibility / 1000,
      gardenAdvice: getGardenAdvice(data.main.temp, data.main.humidity, data.weather[0].main)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Garden advice based on weather
function getGardenAdvice(temp, humidity, condition) {
  if (condition === 'Rain') return '🌧️ Great day to skip watering! Rain will do it for you.'
  if (temp > 35) return '🥵 Very hot! Water your plants early morning or evening.'
  if (temp > 28) return '☀️ Warm day. Check soil moisture and water if dry.'
  if (humidity < 40) return '💧 Low humidity! Plants may need extra watering today.'
  if (humidity > 80) return '🌿 High humidity. Watch out for fungal diseases.'
  return '🌱 Good gardening weather today!'
}

// Get season and crop suggestions for Chennai
router.get('/crops', async (req, res) => {
  try {
    const month = new Date().getMonth() + 1
    let season, crops, soilTip

    if (month >= 6 && month <= 9) {
      season = 'Kharif (Monsoon)'
      crops = [
        { name: 'Rice', emoji: '🌾', tip: 'Perfect monsoon crop', difficulty: 'Medium' },
        { name: 'Maize', emoji: '🌽', tip: 'Grows well in rain', difficulty: 'Easy' },
        { name: 'Groundnut', emoji: '🥜', tip: 'Great for Chennai soil', difficulty: 'Easy' },
        { name: 'Sesame', emoji: '🌿', tip: 'Drought tolerant', difficulty: 'Easy' },
        { name: 'Okra', emoji: '🥬', tip: 'Fast growing vegetable', difficulty: 'Easy' },
        { name: 'Bitter Gourd', emoji: '🥒', tip: 'Thrives in humidity', difficulty: 'Medium' },
      ]
      soilTip = 'Soil is moist from monsoon. Ensure good drainage to prevent waterlogging.'
    } else if (month >= 10 && month <= 12) {
      season = 'Rabi (Winter)'
      crops = [
        { name: 'Tomato', emoji: '🍅', tip: 'Best season for tomatoes', difficulty: 'Easy' },
        { name: 'Brinjal', emoji: '🍆', tip: 'Grows well in cool weather', difficulty: 'Easy' },
        { name: 'Spinach', emoji: '🥬', tip: 'Quick harvest in 30 days', difficulty: 'Easy' },
        { name: 'Coriander', emoji: '🌿', tip: 'Essential kitchen herb', difficulty: 'Easy' },
        { name: 'Beans', emoji: '🫘', tip: 'Great nitrogen fixer', difficulty: 'Medium' },
        { name: 'Carrot', emoji: '🥕', tip: 'Perfect for cool weather', difficulty: 'Medium' },
      ]
      soilTip = 'Cool and dry soil. Add compost before planting for best results.'
    } else if (month >= 1 && month <= 3) {
      season = 'Spring'
      crops = [
        { name: 'Sunflower', emoji: '🌻', tip: 'Brightens the garden', difficulty: 'Easy' },
        { name: 'Cucumber', emoji: '🥒', tip: 'Fast growing in warmth', difficulty: 'Easy' },
        { name: 'Watermelon', emoji: '🍉', tip: 'Loves Chennai heat', difficulty: 'Medium' },
        { name: 'Chilli', emoji: '🌶️', tip: 'Essential Tamil crop', difficulty: 'Easy' },
        { name: 'Drumstick', emoji: '🌿', tip: 'Hardy Tamil Nadu tree', difficulty: 'Easy' },
        { name: 'Curry Leaf', emoji: '🍃', tip: 'Essential for Tamil cooking', difficulty: 'Easy' },
      ]
      soilTip = 'Soil warming up. Good time to add organic matter and prepare beds.'
    } else {
      season = 'Summer'
      crops = [
        { name: 'Bottle Gourd', emoji: '🥬', tip: 'Heat tolerant creeper', difficulty: 'Easy' },
        { name: 'Snake Gourd', emoji: '🥒', tip: 'Thrives in Chennai heat', difficulty: 'Easy' },
        { name: 'Cluster Beans', emoji: '🫘', tip: 'Drought resistant', difficulty: 'Easy' },
        { name: 'Moringa', emoji: '🌿', tip: 'Superfood tree for hot climates', difficulty: 'Easy' },
        { name: 'Sweet Potato', emoji: '🍠', tip: 'Heat and drought tolerant', difficulty: 'Easy' },
        { name: 'Turmeric', emoji: '🌱', tip: 'Traditional Tamil crop', difficulty: 'Medium' },
      ]
      soilTip = 'Hot and dry. Mulch heavily to retain moisture. Water daily in early morning.'
    }

    res.json({ season, month, crops, soilTip })
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;