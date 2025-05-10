import { OpenAI } from "openai";
import dotenv from "dotenv";
import { searchRawLocationData, enrichLocationsWithAnime } from "../services/locationService.js";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analyzeUserInput = async (req, res) => {
  const { prompt, startDate, endDate } = req.body;
  console.log("🟢 Prompt received:", prompt);
  console.log("📆 Start:", startDate, "End:", endDate);

  if (!prompt || !startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "Missing prompt, startDate, or endDate" });
  }

  try {
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful travel assistant. Reply in valid JSON only, following the given format strictly.",
        },
        {
          role: "user",
          content: buildUserQueryPrompt(prompt, startDate, endDate), // response in JSON format which defines the itinerary
        },
      ],
      temperature: 0.3, // Adjust the creativity of the response
    });

    const reply = chatResponse.choices[0].message.content;
    console.log(`✅ Response from ChatGPT`);
    const parsed = JSON.parse(reply);

    console.log("Parsed JSON:", parsed);

    //fetch the trip data from the database
    const locations = parsed.locations?.map((l) => l.location) || [];
    const themes = parsed.themes?.map((t) => t.theme) || [];


    console.log("Locations:", locations);
    console.log("Themes:", themes);
    // search for anime by location keyword in mongoDB

    const rawLocations = await searchRawLocationData(locations);
    const enrichedLocations = await enrichLocationsWithAnime(rawLocations);

    console.log("Raw Locations:", rawLocations);
    console.log("Enriched Locations:", enrichedLocations);

    const result = enrichedLocations;

    // sent back the parsed JSON
    try {
      res.json({
        parsed, // locations, themes, dates
        matches: result,
      });

      console.log("✅ Parsed JSON successfully", JSON.parse(reply));
    } catch (e) {
      console.error("❌ Invalid JSON from AI:", e);
      res.status(500).json({ error: "AI returned invalid JSON", raw: reply });
    }
  } catch (err) {
    console.error("❌ ChatGPT Error:", err);
    res
      .status(500)
      .json({ error: "Failed to generate itinerary from ChatGPT." });
  }
};

// Helper function to build prompt
function buildUserQueryPrompt(prompt, startDate, endDate) {
  return `You are a travel request analyzer.

Your task:
- Carefully extract any locations (e.g., cities, places, landmarks).
- Carefully extract any themes (e.g., general topics like nature, culture, anime).
- Special note: If the user mentions an anime, manga, or anime movie title (e.g., "Your Name", "Attack on Titan"), treat it as a **theme**.

Strict output:
You must strictly return the result in the following JSON format:

{
  "locations": [
    { "index": 1, "location": "..." },
    { "index": 2, "location": "..." }
  ],
  "themes": [
    { "index": 1, "theme": "..." },
    { "index": 2, "theme": "..." }
  ],
  "startDate": "${startDate}",
  "endDate": "${endDate}"
}

Important rules:
- You must include "startDate" and "endDate" exactly as provided above.
- Do not invent new locations or themes.
- Only extract what is mentioned or implied.
- Output only the JSON and nothing else.
- Do not explain anything outside of the JSON.

User Request: "${prompt}"
`;
}

export { analyzeUserInput };
