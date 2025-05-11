// backend/routes/ChatGPTRoutes.js
import express from "express";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import Location from "../models/Location.js"; // <-- Import Location model
import { buildReplanDayItineraryPrompt } from "../config/AIPromptConfig.js";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Adjust path to your OpenAI client configuration

export async function replanSingleDayItinerary(newlyAddedLocation, existingDayItinerary, originalUserRequest) {
  // Validate essential inputs (basic checks can remain if this function is ever called directly elsewhere,
  // but primary validation should be in the controller)
  if (!newlyAddedLocation || !existingDayItinerary || !originalUserRequest) {
    // Instead of res.status().json(), throw an error
    throw new Error("Missing required parameters: newlyAddedLocation, existingDayItinerary, or originalUserRequest.");
  }
  // Example: Ensure newlyAddedLocation has lat and lng
  if (newlyAddedLocation.lat === undefined || newlyAddedLocation.lng === undefined) {
    throw new Error("The 'newlyAddedLocation' must include 'lat' (latitude) and 'lng' (longitude).");
  }
  if (!existingDayItinerary.date) {
    throw new Error("The 'existingDayItinerary' must include a 'date'.");
  }

  try {
    // Construct the detailed prompt for ChatGPT
    const promptContent = buildReplanDayItineraryPrompt(newlyAddedLocation, existingDayItinerary, originalUserRequest);

    // Call OpenAI API
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert travel itinerary planner. You MUST reply in valid JSON format only, strictly adhering to the structure provided in the user\\'s prompt. Do not include any additional text, explanations, or markdown formatting outside of the main JSON object."
        },
        {
          role: "user",
          content: promptContent,
        }
      ],
      temperature: 0.7,
      // response_format: { type: "json_object" }, // Consider enabling if fully supported and desired
    });

    const aiReply = chatResponse.choices[0].message.content;

    try {
      // Clean the AI reply to remove markdown code block fences if present
      let cleanedReply = aiReply.trim();
      if (cleanedReply.startsWith("```json")) {
        cleanedReply = cleanedReply.substring(7);
      }
      if (cleanedReply.endsWith("```")) {
        cleanedReply = cleanedReply.substring(0, cleanedReply.length - 3);
      }
      cleanedReply = cleanedReply.trim(); // Trim again after stripping fences

      // Parse the cleaned AI's response
      const parsedItineraryDay = JSON.parse(cleanedReply);
      return parsedItineraryDay; // Return the parsed data
    } catch (e) {
      console.error("Error: AI returned invalid JSON for day replan.", e);
      console.error("Raw AI reply that caused parsing error:", aiReply); // Log the original, uncleaned reply
      // Throw a new error that can be caught by the caller
      throw new Error(`AI returned invalid JSON content for the day itinerary. Raw: ${aiReply}`);
    }

  } catch (err) {
    // Log the original error for server-side debugging
    console.error("Error during ChatGPT API call or processing for day replan:", err.message);
    // Re-throw the error to be handled by the caller (AIControllers.js)
    // This allows the controller to decide on the appropriate HTTP response.
    throw new Error(`Failed to generate the replanned day itinerary. Details: ${err.message}`);
  }
}

