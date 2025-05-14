// backend/routes/ChatGPTRoutes.js
import express from "express";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import { searchRelevantLocationsService } from "../controllers/LocationController.js";

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to build prompt for itinerary generation
function buildItineraryPrompt(prompt, startDate, endDate) {
  return `You are a travel planner specializing in Japanese anime tourism.
I will give you a request in natural language, along with a start and end date.
Generate a structured JSON plan. For each day from ${startDate} to ${endDate},
provide a full-day travel schedule, with time and activity description, focusing on anime-related attractions, events, and experiences.
Use your knowledge base and information from the web to find relevant anime locations.
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
            "You are a helpful travel assistant specializing in Japanese anime tourism. Reply in valid JSON only, following the given format strictly, and ensure the itinerary focuses on anime-related content.",
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

// Placeholder for RAG - Retrieval Step - THIS FUNCTION IS NOW REMOVED
// async function fetchRelevantPlaces(extractedInfo) { ... }

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
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a helpful travel planner assistant specializing in Japanese anime. Extract key information from the user's request, with a particular focus on anime-related interests. Respond ONLY with the JSON object, nothing else. Prioritize extracting specific anime/manga/movie titles mentioned by the user as 'interests' over the general term 'anime'. Structure: {"destination": "...", "interests": ["...", "..."], "budget": "...", "startDate": "YYYY-MM-DD or null", "endDate": "YYYY-MM-DD or null"}`,
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
    console.log(
      "Performing initial retrieval step (and using these directly for AI context)..."
    );
    try {
      retrievedPlaces = await searchRelevantLocationsService(extractedInfo);
      console.log(
        `Retrieved ${retrievedPlaces.length} places via LocationService.`
      );
    } catch (retrievalError) {
      console.error(
        "Initial retrieval failed:",
        retrievalError,
        "Proceeding without retrieved places."
      );
      retrievedPlaces = [];
    }

    // --- 3. Augmentation & Streaming Generation Step ---
    console.log(
      " Building augmented prompt and starting stream with initially retrieved places..."
    );
    const systemPrompt = {
      role: "system",
      content:
        "You are a helpful travel planner specializing in Japanese anime tourism. Generate a detailed, day-by-day itinerary based on the user's request and conversation history, with a strong focus on anime-related attractions, events, and experiences. \n" +
        "**Crucially, when a specific anime, manga, or movie title (e.g., 'Your Name', 'Spirited Away') is provided by the user, you MUST prioritize researching and including real-world locations prominently featured in or significantly associated with that title. Use your knowledge base and, if necessary, simulate web searches to find these specific, iconic locations.** For example, for 'Your Name,' this would include places like the Suga Shrine stairs in Yotsuya, Tokyo, or locations around Lake Suwa if Hida is too far. Generic locations should only be used if specific ones cannot be found or if the user requests them.\n" +
        "You will be provided with a list of [Context Places] that have known coordinates. " +
        "**When suggesting specific activities at named locations, YOU MUST PRIORITIZE using place names EXACTLY as they appear in the [Context Places] list if you want them to be geocoded in the final structured output, especially if these are the anime-specific locations you researched.** " +
        "If a suitable place name from the [Context Places] cannot be found for an activity, or if your research didn't yield a geocodable context place for an iconic anime spot, you can suggest a generic activity (e.g., 'Lunch at a local anime-themed cafe') or clearly state that a specific named place from the context wasn't suitable or that a well-known anime location couldn't be precisely mapped to the provided context places." +
        "\n\n**Behavior Instructions:**" +
        "\n- When the user asks to modify an existing itinerary (e.g., add a day, change an activity), update the *existing* itinerary accordingly, incorporating previous turns of the conversation and context. Do not generate a completely new, unrelated itinerary unless the user explicitly asks for one." +
        "\n- **Crucially, do NOT include latitude and longitude coordinates (e.g., '(lat: ..., lng: ...)') in the descriptive text for activities or locations.**" +
        "\n- If, for any given day, no relevant anime-focused activities or places (especially from the [Context Places]) can be suggested based on the user's request, clearly state that and do not generate an empty schedule for that day. You can suggest the user provide more details or try a different anime-related interest for that day." +
        "\n- Include practical anime-related travel tips at the end if relevant (e.g., where to buy merchandise, information on specific anime studios or museums)." +
        "\n- Be conversational and enthusiastic, sharing your passion for anime!" +
        "\n\n**Formatting Instructions:**" +
        "\n- Structure the response clearly using Markdown, following the Day -> Time Section -> Activity format." +
        "\n- For each day, include sections for 'Morning:', 'Afternoon:', and 'Evening:'. Use ONLY bold Markdown for these section titles (e.g., `**Morning:**`). DO NOT use heading syntax (`###`)." +
        "\n- Within each time section, use bullet points (-) for specific activities/locations. **Crucially, start each activity line with a suggested realistic start time in HH:MM format**, followed by the activity name and description, formatted like this: `- **HH:MM - Activity/Location Name:** Brief Description.`" +
        "\n- **CRITICAL:** When mentioning a specific place or attraction within the 'Brief Description' part (i.e., AFTER the colon ':'), and you are using a name from the [Context Places], format it like this: `***Place Name***` (bold and italics). If it's a generic place not from the context, use normal text." +
        "\n- **IMPORTANT:** Do NOT use italics for the main '**HH:MM - Activity/Location Name:**' part before the colon. Use bold (`**...**`) only where specified (Time, Activity/Location Name, and Time sections)." +
        "\n\n**Date Handling Instructions:**" +
        "\n- The **required format** for the 'date' field is **'YYYY-MM-DD'**. \n" +
        "\n- Use the provided 'Start Date' (" +
        extractedInfo.startDate +
        ") as the date for the first day (the object with index: 1).\n" +
        "\n- The same place (same lat and lng) can only appear ONCE in the itinerary.\n" +
        "\n- For each subsequent day object (index: 2, index: 3, etc.), calculate the date by **adding one day** to the date of the previous day object. \n" +
        "\n- The 'date' field **MUST** contain a valid 'YYYY-MM-DD' string based on these rules. **Do not output null or invalid date strings.**\n\n" +
        "**Location Handling Instructions:**\n" +
        "- Use the provided 'Retrieved Places' list as the SOLE source for 'lat' and 'lng'.\n" +
        "- Carefully extract the 'Activity/Location Name' from each Markdown itinerary item. This is the text that appears after the 'HH:MM - ' and before the terminating colon ':'.\n" +
        "- Perform an **EXACT, CASE-INSENSITIVE match** for this extracted 'Activity/Location Name' against the 'name' field in each entry of the 'Retrieved Places' list.\n" +
        "- If such an exact, case-insensitive match is found, use its 'lat', 'lng', and 'city' values for the JSON object.\n" +
        "- **Crucially: If NO exact, case-insensitive match is found** for the extracted 'Activity/Location Name' within the 'Retrieved Places' list, or if the matched place from 'Retrieved Places' does not have 'lat' and 'lng' values, then you **MUST OMIT** that entire activity object from the 'itinerary' array for the current day. Do not attempt to find a 'closest match' or 'similar match'. Only exact, case-insensitive matches are permitted.\n" +
        "- If a match is made and coordinates are used, for that itinerary object, fill the 'city' field using the 'city' property from the matched place in the 'Retrieved Places' list. If no city is available from the matched place, set 'city' to null.\n" +
        "**Time Handling Instructions:**\n" +
        "- Each Markdown activity line starts with a time in **HH:MM** format (e.g., '- **09:30 - Activity:** ...').\n" +
        "- Extract this **HH:MM** time and place it into the **'arrivalTime'** field in the JSON object for that activity. Ensure it's a string.\n\n",
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
            `${p.addresses[0] || "Unknown Address"} (lat: ${p.lat}, lng: ${p.lng
            })`
        )
        .join("; ");

      userMessageWithContext += `\n\n[Context Places: ${contextString}]`; // Clearly label the context
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

    let suggestionsPayload;
    if (structuredItineraryJson) {
      // Filter out days with empty itineraries before assigning to suggestionsPayload
      if (
        structuredItineraryJson.content &&
        Array.isArray(structuredItineraryJson.content)
      ) {
        structuredItineraryJson.content =
          structuredItineraryJson.content.filter(
            (day) =>
              day.itinerary &&
              Array.isArray(day.itinerary) &&
              day.itinerary.length > 0
          );
      }

      suggestionsPayload = structuredItineraryJson;
      console.log(
        "Suggestion structure (filtered for non-empty day itineraries):",
        JSON.stringify(suggestionsPayload, null, 2)
      );

      // Send suggestion event only if suggestionsPayload.content is an array and has items AFTER filtering
      if (
        suggestionsPayload &&
        suggestionsPayload.content &&
        Array.isArray(suggestionsPayload.content) &&
        suggestionsPayload.content.length > 0
      ) {
        res.write(`event: suggestion\n`);
        res.write(`data: ${JSON.stringify(suggestionsPayload)}\n\n`);
        console.log(" Suggestion event sent.");
      } else {
        console.log(
          "No valid suggestions with non-empty day itineraries left after filtering."
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
  const targetJsonStructureExample = `{
  "title": "Trip Title",
  "content": [
    {
      "date": "YYYY-MM-DD",
      "index": 1,
      "itinerary": [
        {
          "image": "https://example.com/image.jpg",
          "lat": 35.6895,
          "lng": 139.6917,
          "city": "Tokyo",
          "order": 1,
          "arrivalTime": "HH:MM",
          "note": "Description..."
        },
        {
          "image": "https://example.com/image2.jpg",
          "lat": 34.6937,
          "lng": 135.5023,
          "city": "Osaka",
          "order": 2,
          "arrivalTime": "HH:MM",
          "note": "Description..."
        }
      ]
    },
    {
      "date": "YYYY-MM-DD",
      "index": 2,
      "itinerary": [
        {
          "image": "https://example.com/image3.jpg",
          "lat": 35.6814,
          "lng": 139.7671,
          "city": "Tokyo",
          "order": 1,
          "arrivalTime": "HH:MM",
          "note": "Description..."
        }
      ]
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini", // Use the appropriate model
      messages: [
        {
          role: "system",
          content: `You are a data conversion assistant. Parse the provided Markdown travel itinerary, which is focused on Japanese anime tourism, and convert it STRICTLY into a JSON object matching the structure below. Generate a title based on the whole trip as the 'title' field in the JSON object, no more than 50 characters including spaces, reflecting the anime theme of the trip if possible (e.g., "Anime Pilgrimage to Tokyo", "Exploring Akihabara").\n\n
          **Date Handling Instructions:**\n
          1. The **required format** for the 'date' field is **'YYYY-MM-DD'**. \n
          2. Use the provided 'Start Date' (${extractedInfo.startDate
            }) as the date for the first day (the object with index: 1).\n
          3. The same place (same lat and lng) can only appear ONCE in the itinerary.\n
          4. For each subsequent day object (index: 2, index: 3, etc.), calculate the date by **adding one day** to the date of the previous day object. \n
          5. The 'date' field **MUST** contain a valid 'YYYY-MM-DD' string based on these rules. **Do not output null or invalid date strings.**\n\n
          **Location Handling Instructions:**\n
          - Use the provided 'Retrieved Places' list as the SOLE source for 'lat' and 'lng'.\n
          - Carefully extract the 'Activity/Location Name' from each Markdown itinerary item. This is the text that appears after the 'HH:MM - ' and before the terminating colon ':'.\n
          - Perform an **EXACT, CASE-INSENSITIVE match** for this extracted 'Activity/Location Name' against the 'name' field in each entry of the 'Retrieved Places' list.\n
          - If such an exact, case-insensitive match is found, use its 'lat', 'lng', and 'city' values for the JSON object.\n
          - **Crucially: If NO exact, case-insensitive match is found** for the extracted 'Activity/Location Name' within the 'Retrieved Places' list, or if the matched place from 'Retrieved Places' does not have 'lat' and 'lng' values, then you **MUST OMIT** that entire activity object from the 'itinerary' array for the current day. Do not attempt to find a 'closest match' or 'similar match'. Only exact, case-insensitive matches are permitted.\n
          - If a match is made and coordinates are used, for that itinerary object, fill the 'city' field using the 'city' property from the matched place in the 'Retrieved Places' list. If no city is available from the matched place, set 'city' to null.\n
          **Time Handling Instructions:**\n
          - Each Markdown activity line starts with a time in **HH:MM** format (e.g., '- **09:30 - Activity:** ...').\n
          - Extract this **HH:MM** time and place it into the **'arrivalTime'** field in the JSON object for that activity. Ensure it's a string.\n\n
          Respond ONLY with the valid JSON object, nothing else. \n\n
          **Start Date:** ${extractedInfo.startDate}\n
          **Retrieved Places:** ${JSON.stringify(retrievedPlaces)}\n\n
          **JSON Structure Example:**\n
          ${targetJsonStructureExample}\n\n
          **Example Markdown Input Format:**\n
          - **09:00 - Tokyo Tower:** Visit the iconic tower.\n
          - **11:30 - Senso-ji Temple:** Explore Asakusa.`,
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
      if (parsedJson.content && Array.isArray(parsedJson.content)) {
        // Filter out duplicate lat/lng pairs across all days
        const seenCoords = new Set();
        for (const day of parsedJson.content) {
          if (Array.isArray(day.itinerary)) {
            day.itinerary = day.itinerary.filter((activity) => {
              if (
                typeof activity.lat === "number" &&
                typeof activity.lng === "number"
              ) {
                const key = `${activity.lat},${activity.lng}`;
                if (seenCoords.has(key)) {
                  return false;
                } else {
                  seenCoords.add(key);
                  return true;
                }
              }
              // If no lat/lng, keep the activity (or you can choose to filter it out)
              return true;
            });
          }
        }
        console.log(
          "Successfully converted Markdown to JSON structure (duplicates filtered)."
        );
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
