const express = require('express');
const router = express.Router();
const axios = require('axios');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: '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' });
const WEATHER_API_KEY = '232a66fe04a5e669c14df10e3ebd0f9f';

router.post('/suggest', async (req, res) => {
  try {
    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=Chennai&appid=${WEATHER_API_KEY}&units=metric`
    );
    const weather = weatherRes.data;
    const month = new Date().getMonth() + 1;

    const prompt = `You are an expert agricultural advisor for Chennai, Tamil Nadu, India.

Current conditions:
- Temperature: ${Math.round(weather.main.temp)}°C
- Humidity: ${weather.main.humidity}%
- Weather: ${weather.weather[0].description}
- Month: ${month}

User question: ${req.body.question || 'What should I plant in my community garden right now?'}

Please provide:
1. Top 3 crop recommendations for current conditions
2. Soil preparation tips
3. Watering schedule
4. Common pests to watch out for
5. One fun gardening tip

Keep response friendly, practical and specific to Chennai climate. Use emojis. Keep it concise.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
    });

    const text = completion.choices[0]?.message?.content || 'No response generated';
    res.json({ suggestion: text });
  } catch (err) {
    console.log('AI Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;