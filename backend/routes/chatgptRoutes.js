// backend/routes/chatgptRoutes.js
const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to build prompt
function buildPrompt(prompt, startDate, endDate) {
    return `You are a travel planner.
I will give you a request in natural language, along with a start and end date.
Generate a structured JSON plan. For each day from ${startDate} to ${endDate},
provide a full-day travel schedule, with time and activity description.
Keep all responses in this exact JSON format:
{
  "itinerary": [
    {
      "date": "YYYY-MM-DD",
      "activities": [
        { "time": "HH:MM", "description": "..." },
        ...
      ]
    },
    ...
  ]
}
User request: "${prompt}"`;
}

// POST /api/chatgpt/itinerary
router.post('/itinerary', async (req, res) => {
    const { prompt, startDate, endDate } = req.body;
    console.log('🟢 Prompt received:', prompt);
    console.log('📆 Start:', startDate, 'End:', endDate);

    if (!prompt || !startDate || !endDate) {
        return res.status(400).json({ error: 'Missing prompt, startDate, or endDate' });
    }

    try {
        const chatResponse = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful travel assistant. Reply in valid JSON only, following the given format strictly.',
                },
                {
                    role: 'user',
                    content: buildPrompt(prompt, startDate, endDate), // response in JSON format which defines the itinerary
                },
            ],
            temperature: 0.7, // Adjust the creativity of the response
        });

        const reply = chatResponse.choices[0].message.content;
        console.log('✅ Response from ChatGPT');

        try {
            res.json(JSON.parse(reply));
        } catch (e) {
            console.error('❌ Invalid JSON from AI:', e);
            res.status(500).json({ error: 'AI returned invalid JSON', raw: reply });
        }

    } catch (err) {
        console.error('❌ ChatGPT Error:', err);
        res.status(500).json({ error: 'Failed to generate itinerary from ChatGPT.' });
    }
});

module.exports = router;
