import { OpenAI } from "openai";
import dotenv from "dotenv";
import { searchRawLocationDataByLocateAnime } from "../services/LocService.js";
import { buildUserQueryPrompt } from "../utils/AIPrompt.js";

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
    return res
      .status(400)
      .json({ error: "Missing 'currentItinerary' in request body." });
  }
  if (!currentItinerary.date) {
    return res
      .status(400)
      .json({ error: "The 'currentItinerary' must include a 'date'." });
  }

  const itineraryDate = currentItinerary.date;
  console.log("ℹ️ Itinerary Date for AI prompt:", itineraryDate);

  try {
    // Step 1: Initial AI call to extract locations and themes from the user's prompt
    const initialChatResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful travel assistant. Reply in valid JSON only, following the given format strictly.",
        },
        {
          role: "user",
          content: buildUserQueryPrompt(prompt, itineraryDate, itineraryDate),
        },
      ],
      temperature: 0.3,
    });

    const initialReply = initialChatResponse.choices[0].message.content;
    console.log(
      `✅ Response from initial ChatGPT for location/theme extraction`
    );
    let initialAIResponse;
    try {
      initialAIResponse = JSON.parse(initialReply);
    } catch (e) {
      console.error(
        "❌ Invalid JSON from initial AI for location/theme extraction:",
        e
      );
      console.error("Raw AI reply:", initialReply);
      return res.status(500).json({
        error: "Initial AI (location/theme extraction) returned invalid JSON",
        raw: initialReply,
      });
    }
    console.log("Parsed JSON from initial AI:", initialAIResponse);

    const locations = initialAIResponse.locations?.map((l) => l.location) || [];
    const potentialTitles =
      initialAIResponse.potential_titles?.map((t) => t.title) || [];
    const otherThemes =
      initialAIResponse.other_themes?.map((t) => t.theme) || [];

    console.log("Extracted Locations:", locations);
    console.log("Extracted Potential Titles:", potentialTitles);
    console.log("Extracted Other Themes:", otherThemes);

    // Process potential titles into individual keywords
    let keywordsFromTitles = [];
    potentialTitles.forEach((title) => {
      if (typeof title === "string") {
        // Basic check
        // Split title into words, convert to lowercase, filter empty strings
        const words = title
          .toLowerCase()
          .split(/\s+/)
          .filter((word) => word.length > 0);
        keywordsFromTitles.push(...words);
      }
    });
    // Combine with other themes if necessary, ensure uniqueness and lowercase
    const combinedKeywords = [
      ...new Set([
        ...keywordsFromTitles,
        ...otherThemes
          .map((theme) =>
            typeof theme === "string" ? theme.toLowerCase() : ""
          )
          .filter((theme) => theme.length > 0),
      ]),
    ];

    console.log("Keywords for DB Search:", combinedKeywords);

    // Step 2: Search for raw location data based on extracted locations and processed keywords
    // This data will be the 'newlyAddedLocation' for the replanning step
    const rawLocations = await searchRawLocationDataByLocateAnime(
      locations,
      combinedKeywords
    );
    console.log("Raw Locations from DB search:", rawLocations);
    res.json(rawLocations); // Send the whole array
    console.log("✅ Successfully sent location suggestions to client.");
  } catch (err) {
    console.error(
      "❌ Error in analyzeUserInput processing pipeline:",
      err.message
    );
    // Check if the error is from our known error types
    // or a general error. This helps in sending a more specific error message.
    if (
      err.message.includes("AI returned invalid JSON") ||
      err.message.includes("Failed to generate the replanned day itinerary")
    ) {
      res.status(500).json({
        error: "Failed to process itinerary replan with AI.",
        details: err.message,
      });
    } else {
      res.status(500).json({
        error:
          "An unexpected error occurred while analyzing user input and replanning.",
        details: err.message,
      });
    }
  }
};

const itinerary = async (req, res) => {
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
};

const argumentItinerary = async (req, res) => {
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
            content: buildExtractionPrompt(userMessageText),
          },
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
    const systemPrompt = buildArgumentSystemPrompt(extractedInfo.startDate);

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
};

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

  try {
    const systemPrompt = buildJsonConversionSystemPrompt({
      extractedInfo,
      retrievedPlaces,
    });
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini", // Use the appropriate model
      messages: [
        systemPrompt,
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

export { analyzeUserInput, itinerary, argumentItinerary };
