import { OpenAI } from "openai";
import dotenv from "dotenv";
import { searchRawLocationDataByLocateAnime } from "../services/locationService.js";


dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analyzeUserInput = async (req, res) => {
  const { prompt, currentItinerary } = req.body;
  console.log("🟢 Prompt received:", prompt);
  console.log("🗓️ Current Itinerary received:", currentItinerary);

  // Validate essential inputs from req.body
  if (!prompt) {
    return res.status(400).json({ error: "Missing 'prompt' in request body." });
  }
  if (!currentItinerary) {
    return res.status(400).json({ error: "Missing 'currentItinerary' in request body." });
  }
  if (!currentItinerary.date) {
    return res.status(400).json({ error: "The 'currentItinerary' must include a 'date'." });
  }

  const itineraryDate = currentItinerary.date;
  console.log("ℹ️ Itinerary Date for AI prompt:", itineraryDate);

  try {
    // Step 1: Initial AI call to extract locations and themes from the user's prompt
    const initialChatResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful travel assistant. Reply in valid JSON only, following the given format strictly.",
        },
        {
          role: "user",
          // Note: buildUserQueryPrompt was simplified in previous steps to only take prompt, startDate, endDate
          // We are using itineraryDate for both start and end as it's a single day context
          content: buildUserQueryPrompt(prompt, itineraryDate, itineraryDate),
        },
      ],
      temperature: 0.3,
    });

    const initialReply = initialChatResponse.choices[0].message.content;
    console.log(`✅ Response from initial ChatGPT for location/theme extraction`);
    let initialAIResponse;
    try {
      initialAIResponse = JSON.parse(initialReply);
    } catch (e) {
      console.error("❌ Invalid JSON from initial AI for location/theme extraction:", e);
      console.error("Raw AI reply:", initialReply);
      return res.status(500).json({ error: "Initial AI (location/theme extraction) returned invalid JSON", raw: initialReply });
    }
    console.log("Parsed JSON from initial AI:", initialAIResponse);

    const locations = initialAIResponse.locations?.map((l) => l.location) || [];
    const themes = initialAIResponse.themes?.map((t) => t.theme) || [];

    console.log("Extracted Locations:", locations);
    console.log("Extracted Themes:", themes);

    // Step 2: Search for raw location data based on extracted locations/themes
    // This data will be the 'newlyAddedLocation' for the replanning step
    const rawLocations = await searchRawLocationDataByLocateAnime(locations, themes);
    console.log("Raw Locations from DB search:", rawLocations);
    res.json(rawLocations); // Send the whole array
    console.log("✅ Successfully sent location suggestions to client.");

  } catch (err) {
    console.error("❌ Error in analyzeUserInput processing pipeline:", err.message);
    // Check if the error is from our known error types (e.g., from replanSingleDayItinerary)
    // or a general error. This helps in sending a more specific error message.
    if (err.message.includes("AI returned invalid JSON") || err.message.includes("Failed to generate the replanned day itinerary")) {
      res.status(500).json({ error: "Failed to process itinerary replan with AI.", details: err.message });
    } else {
      res.status(500).json({ error: "An unexpected error occurred while analyzing user input and replanning.", details: err.message });
    }
  }
};

// Helper function to build prompt (ensure it matches the expected parameters)
// This was previously modified to take (prompt, startDate, endDate)
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
