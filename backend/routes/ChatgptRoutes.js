// backend/routes/ChatGPTRoutes.js
import express from "express";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import Location from "../models/Location.js"; // <-- Import Location model

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to build prompt for itinerary generation
function buildItineraryPrompt(prompt, startDate, endDate) {
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

// POST /api/chatgpt/itinerary (Non-streaming)
router.post("/itinerary", async (req, res) => {
  const { prompt, startDate, endDate } = req.body;
  console.log(" Itinerary Prompt received:", prompt);
  console.log(" Start:", startDate, "End:", endDate);

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
          content: buildItineraryPrompt(prompt, startDate, endDate), // response in JSON format which defines the itinerary
        },
      ],
      temperature: 0.7, // Adjust the creativity of the response
    });

    const reply = chatResponse.choices[0].message.content;
    console.log(" Response from ChatGPT for Itinerary");

    try {
      res.json(JSON.parse(reply));
    } catch (e) {
      console.error(" Invalid JSON from AI for Itinerary:", e);
      res.status(500).json({ error: "AI returned invalid JSON", raw: reply });
    }
  } catch (err) {
    console.error(" ChatGPT Itinerary Error:", err);
    res
      .status(500)
      .json({ error: "Failed to generate itinerary from ChatGPT." });
  }
});

// --- RAG Streaming Chat Endpoint ---

// Placeholder for RAG - Retrieval Step
async function fetchRelevantPlaces(extractedInfo) {
  console.log(" Fetching relevant places based on:", extractedInfo);

  const { destination, interests } = extractedInfo;

  // Basic validation
  if (!destination && (!interests || interests.length === 0)) {
    console.log(" No destination or interests provided.");
    return [];
  }

  const queryConditions = [];

  // Add destination condition if provided
  if (destination) {
    const destinationRegex = new RegExp(destination.trim(), "i"); // Case-insensitive
    queryConditions.push({ addresses: { $regex: destinationRegex } });
  }

  // Add interests condition if provided
  if (interests && interests.length > 0) {
    const interestRegexes = interests.map(
      (interest) => new RegExp(interest.trim(), "i")
    );
    queryConditions.push({
      $or: [
        { anime_names: { $in: interestRegexes } },
        { anime_cn_names: { $in: interestRegexes } },
        { anime_en_names: { $in: interestRegexes } },
      ],
    });
  }

  // Combine conditions using $and (if both exist)
  const query = queryConditions.length > 0 ? { $and: queryConditions } : {};

  let places = [];
  try {
    const locations = await Location.find(query)
      .select(
        "country city anime_names anime_cn_names anime_en_names images addresses lat lng"
      )
      .limit(10);

    places = locations.map((loc) => ({
      id: loc._id,
      lat: loc.lat,
      lng: loc.lng,
      addresses: loc.addresses,
      country: loc.country,
      city: loc.city,
      images: loc.images,
      anime_names: loc.anime_names,
      anime_cn_names: loc.anime_cn_names,
      anime_en_names: loc.anime_en_names,
    }));
  } catch (error) {
    console.error("Error fetching relevant places:", error);
    return [];
  }

  console.log(
    ` Found ${
      places.length
    } places matching query for destination: '${destination}', interests: '${interests?.join(
      ", "
    )}'`
  );
  return places;
}

// Helper to build the prompt for the initial information extraction LLM call
function buildExtractionPrompt(userPrompt) {
  console.log(`DEBUG: Building extraction prompt for: "${userPrompt}"`);
  return `Extract destination, interests, budget, start date, and end date from the user prompt. 
**Crucially:** If a specific anime, manga, or movie title (like 'Your Name', 'Spirited Away', 'Naruto') is mentioned as an interest, extract that **exact title**. Do NOT extract the general word 'anime' if a specific title is given.
Format output strictly as JSON: {"destination": "...", "interests": ["...", "..."], "budget": "...", "startDate": "YYYY-MM-DD or null", "endDate": "YYYY-MM-DD or null"}.
Example: User says "Trip to Tokyo, I like Your Name." -> JSON should have "interests": ["Your Name"]
User Prompt: "${userPrompt}"`;
}

// POST /api/chatgpt/augment-itinerary (Streaming with RAG)
router.post("/augment-itinerary", async (req, res) => {
  const { userMessageText, chatHistory } = req.body; // Accept history
  console.log(" Augment Itinerary Prompt received:", userMessageText);

  if (!userMessageText) {
    return res.status(400).json({ error: "Missing user message" });
  }

  // --- SSE Setup ---
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Establish connection immediately

  let fullAiResponse = "";
  let extractedInfo = {};
  let retrievedPlaces = [];
  let messageId = null; // Store the message ID from the first chunk

  try {
    // --- 1. Extraction Step (from latest user message) ---
    console.log(" Performing extraction step...");
    try {
      const extractionResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a helpful travel planner assistant. Extract key information from the user's request. Respond ONLY with the JSON object, nothing else. Prioritize extracting specific anime/manga/movie titles mentioned by the user as 'interests' over the general term 'anime'. Structure: {"destination": "...", "interests": ["...", "..."], "budget": "...", "startDate": "YYYY-MM-DD or null", "endDate": "YYYY-MM-DD or null"}`,
          },
          { role: "user", content: buildExtractionPrompt(userMessageText) },
        ],
        temperature: 0.1,
      });
      const extractionResult = extractionResponse.choices[0].message.content;
      extractedInfo = JSON.parse(extractionResult);

      // Ensure extractedInfo.startDate has a valid value (extracted or default)
      // Check for both falsy values AND the literal string "null"
      if (!extractedInfo.startDate || extractedInfo.startDate === "null") {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        extractedInfo.startDate = tomorrow.toISOString().split("T")[0];
      }
      // Now log the guaranteed value that will be used
      console.log(
        `Using start date for conversion: ${extractedInfo.startDate}`
      );

      console.log(" Extraction successful:", extractedInfo);
    } catch (extractError) {
      console.error(
        " Extraction failed:",
        extractError,
        "Proceeding without extracted info."
      );
      extractedInfo = {};
    }

    // --- 2. Retrieval Step ---
    console.log(" Performing retrieval step...");
    try {
      retrievedPlaces = await fetchRelevantPlaces(extractedInfo);
      console.log(` Retrieved ${retrievedPlaces.length} places.`);
    } catch (retrievalError) {
      console.error(
        " Retrieval failed:",
        retrievalError,
        "Proceeding without retrieved places."
      );
      retrievedPlaces = [];
    }

    // --- 3. Augmentation & Streaming Generation Step ---
    console.log(" Building augmented prompt and starting stream...");
    const systemPrompt = {
      role: "system",
      content:
        "You are a helpful travel planner. Generate a detailed, day-by-day itinerary based on the user's request and conversation history. Also consider the following potentially relevant places mentioned as context (these context items will have 'lat' and 'lng' coordinates)." +
        "\n\n**Formatting Instructions:**" +
        "\n- Structure the response clearly using Markdown, following the Day -> Time Section -> Activity format." +
        "\n- For each day, include sections for 'Morning:', 'Afternoon:', and 'Evening:'. Use ONLY bold Markdown for these section titles (e.g., `**Morning:**`). DO NOT use heading syntax (`###`)." +
        "\n- Within each time section, use bullet points (-) for specific activities/locations. **Crucially, start each activity line with a suggested realistic start time in HH:MM format**, followed by the activity name and description, formatted like this: `- **HH:MM - Activity/Location Name:** Brief Description.`" +
        "\n- **CRITICAL:** When mentioning a specific place or attraction within the 'Brief Description' part (i.e., AFTER the colon ':'), format it like this: `***Place Name***` (bold and italics)." +
        "\n- **IMPORTANT:** Do NOT use italics for the main '**HH:MM - Activity/Location Name:**' part before the colon. Use bold (`**...**`) only where specified (Time, Activity/Location Name, and Time sections)." +
        "\n\n**Behavior Instructions:**" +
        "\n- When the user asks to modify an existing itinerary (e.g., add a day, change an activity), update the *existing* itinerary accordingly, incorporating previous turns of the conversation and context. Do not generate a completely new, unrelated itinerary unless the user explicitly asks for one." +
        "\n- **Crucially, do NOT include latitude and longitude coordinates (e.g., '(lat: ..., lng: ...)') in the descriptive text for activities or locations.**" +
        "\n- Include practical tips at the end if relevant." +
        "\n- Be conversational and enthusiastic!",
    };

    // Map incoming chat history
    const formattedHistory = (chatHistory || [])
      .filter((msg) => msg.text)
      .map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

    // Add retrieved context to the final user message for the AI
    let userMessageWithContext = userMessageText;
    if (retrievedPlaces.length > 0) {
      // Stringify the context for the AI prompt, keeping only essential info
      const contextString = retrievedPlaces
        .map(
          (p) =>
            `${p.addresses[0] || "Unknown Address"} (lat: ${p.lat}, lng: ${
              p.lng
            })`
        )
        .join("; ");

      userMessageWithContext += `\n\n[Context: Consider places like: ${contextString}]`;
    }

    // Construct the full messages array
    const messages = [
      systemPrompt,
      ...formattedHistory,
      { role: "user", content: userMessageWithContext }, // User msg includes context hint
    ];

    // Log the places being added to context
    console.log("\n--- Places Provided to Augmentation AI ---");
    console.log(retrievedPlaces);
    console.log("-----------------------------------------\n");

    // Call OpenAI for streaming completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      stream: true,
    });

    // Stream the main response
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (chunk.id && !messageId) {
        messageId = chunk.id;
      }
      if (content) {
        fullAiResponse += content; // Collect full response
        // Send main response chunk
        res.write(
          `data: ${JSON.stringify({ text: content, id: messageId })}\n\n`
        );
      }
    }
    console.log(" Main Markdown stream finished.");

    // --- Attempt to convert Markdown to Structured JSON ---
    console.log(
      "\n--- Raw AI Markdown Response Start ---\n",
      fullAiResponse,
      "\n--- Raw AI Markdown Response End ---\n"
    );

    // Pass retrievedPlaces and extractedInfo to the conversion function
    const structuredItineraryJson = await convertMarkdownItineraryToJson(
      fullAiResponse,
      retrievedPlaces,
      extractedInfo
    );

    let suggestionsPayload = [];
    if (structuredItineraryJson) {
      console.log(
        "Original structured itinerary:",
        JSON.stringify(structuredItineraryJson, null, 2)
      );

      // Assign the potentially pre-filtered result from the conversion function
      suggestionsPayload = structuredItineraryJson;
      console.log(
        "Suggestion structure (should be pre-filtered):",
        JSON.stringify(suggestionsPayload, null, 2)
      );

      // Send suggestion event only if the conversion returned a non-empty array
      if (Array.isArray(suggestionsPayload) && suggestionsPayload.length > 0) {
        res.write(`event: suggestion\n`);
        res.write(`data: ${JSON.stringify(suggestionsPayload)}\n\n`);
        console.log(" Suggestion event sent.");
      } else {
        console.log(
          " No valid suggestions left after filtering UNKNOWN place IDs."
        );
      }
    } else {
      console.log(
        " No AI response content or failed conversion, not sending suggestion."
      );
    }

    // --- Send [DONE] marker ---
    res.write("data: [DONE]\n\n");
  } catch (error) {
    console.error("Error during augment-itinerary processing:", error);
    // Try to send an error event if possible
    try {
      res.write(`event: error\n`);
      res.write(
        `data: ${JSON.stringify({
          message: "Error processing your request",
          details: error.message,
        })}\n\n`
      );
    } catch (writeErr) {
      console.error(" Failed to write error event to SSE stream:", writeErr);
    }
    // Still send DONE after error event
    res.write("data: [DONE]\n\n");
  } finally {
    // Ensure the response stream is properly ended
    if (!res.writableEnded) {
      res.end();
      console.log(" SSE Stream closed.");
    }
  }
});

// Helper Function to convert Markdown Itinerary to Structured JSON
async function convertMarkdownItineraryToJson(
  markdownItinerary,
  retrievedPlaces,
  extractedInfo
) {
  if (!markdownItinerary) {
    console.error("No Markdown itinerary provided for conversion.");
    return null;
  }
  console.log("Attempting to convert Markdown itinerary to JSON...");
  const targetJsonStructureExample = `[{
        "date": "YYYY-MM-DD",
        "index": 1,
        "itinerary": [
            { "lat": 35.6895, "lng": 139.6917, "order": 1, "arrivalTime": "HH:MM", "note": "Description..." }, 
            { "lat": 34.6937, "lng": 135.5023, "order": 2, "arrivalTime": "HH:MM", "note": "Description..." }
        ]
    },
    {
        "date": "YYYY-MM-DD",
        "index": 2,
        "itinerary": [
            { "lat": 35.6814, "lng": 139.7671, "order": 1, "arrivalTime": "HH:MM", "note": "Description..." }
        ]
    }
]`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini", // Use the appropriate model
      messages: [
        {
          role: "system",
          content: `You are a data conversion assistant. Parse the provided Markdown travel itinerary and convert it STRICTLY into a JSON array matching the structure below. \n\n**Date Handling Instructions:**\n1. The **required format** for the 'date' field is **'YYYY-MM-DD'**. \n2. Use the provided 'Start Date' (${
            extractedInfo.startDate
          }) as the date for the first day (the object with index: 1).\n3. For each subsequent day object (index: 2, index: 3, etc.), calculate the date by **adding one day** to the date of the previous day object. \n4. The 'date' field **MUST** contain a valid 'YYYY-MM-DD' string based on these rules. **Do not output null or invalid date strings.**\n\n**Location Handling Instructions:**\n- Use the provided 'Retrieved Places' list as the SOLE source for 'lat' and 'lng'.\n- Match place names from the Markdown EXACTLY (case-insensitive acceptable, look for the name part after the time and hyphen, e.g., in '- **09:00 - Place Name:** ...', match 'Place Name') with 'name' in 'Retrieved Places'. Use the corresponding 'lat'/'lng'.\n- If a place from Markdown isn't found in 'Retrieved Places' or lacks 'lat'/'lng', OMIT that activity object from the 'itinerary' array.\n\n**Time Handling Instructions:**\n- Each Markdown activity line starts with a time in **HH:MM** format (e.g., '- **09:30 - Activity:** ...').\n- Extract this **HH:MM** time and place it into the **'arrivalTime'** field in the JSON object for that activity. Ensure it's a string.\n\nRespond ONLY with the valid JSON array, nothing else. \n\n**Start Date:** ${
            extractedInfo.startDate
          }\n**Retrieved Places:**\n${JSON.stringify(
            retrievedPlaces
          )}\n\n**JSON Structure Example:**\n${targetJsonStructureExample}\n\n**Example Markdown Input Format:**\n- **09:00 - Tokyo Tower:** Visit the iconic tower.\n- **11:30 - Senso-ji Temple:** Explore Asakusa.`,
        },
        {
          role: "user",
          content: `Convert the following Markdown itinerary to the specified JSON format:\n\n${markdownItinerary}`,
        },
      ],
      temperature: 0.1,
    });

    const jsonResultString = response.choices[0].message.content;
    console.log("Raw JSON conversion result from AI:", jsonResultString);

    // --- FIX: Clean the string before parsing ---
    let cleanedJsonString = jsonResultString.trim();
    // Remove potential Markdown fences
    if (cleanedJsonString.startsWith("```json")) {
      cleanedJsonString = cleanedJsonString.substring(7); // Remove ```json
    }
    if (cleanedJsonString.endsWith("```")) {
      cleanedJsonString = cleanedJsonString.substring(
        0,
        cleanedJsonString.length - 3
      ); // Remove ```
    }
    cleanedJsonString = cleanedJsonString.trim(); // Trim again after removing fences
    // --- End FIX ---

    try {
      const parsedJson = JSON.parse(cleanedJsonString); // Parse the cleaned string
      if (Array.isArray(parsedJson)) {
        console.log("Successfully converted Markdown to JSON structure.");
        return parsedJson;
      } else {
        console.error(
          "AI conversion result was not a valid JSON array:",
          parsedJson
        );
        return null;
      }
    } catch (parseError) {
      console.error(
        "Failed to parse JSON result from AI conversion:",
        parseError,
        "Cleaned string attempt:",
        cleanedJsonString
      );
      return null;
    }
  } catch (error) {
    console.error(
      "Error calling OpenAI for Markdown-to-JSON conversion:",
      error
    );
    return null;
  }
}

export default router;
