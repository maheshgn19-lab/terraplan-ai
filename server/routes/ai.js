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

    const userQuestion = req.body.question?.trim() || 'What should I plant in my community garden right now?';

    const prompt = `You are an expert agricultural advisor specializing in Chennai, Tamil Nadu, India.

Current real-time conditions in Chennai:
- Temperature: ${Math.round(weather.main.temp)}°C
- Humidity: ${weather.main.humidity}%
- Weather: ${weather.weather[0].description}
- Month: ${month} (${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month-1]})

The user has asked: "${userQuestion}"

Instructions:
- Answer ONLY what the user has asked. Do NOT give a generic template response.
- Tailor your answer specifically to the question — if they ask about pests, focus on pests; if they ask about watering, focus on watering; if they ask about a specific crop, focus on that crop.
- Use the current Chennai weather and month as relevant context to make your answer accurate and timely.
- Provide a moderately detailed answer: cover the key points thoroughly but stay focused and practical.
- Use emojis where helpful to make the answer readable.
- Do NOT repeat the same 5-section template (crops/soil/watering/pests/tip) for every question. Only include those sections if they are directly relevant to what was asked.
- Write in a friendly, conversational tone suited for a community gardener in Chennai.`;

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