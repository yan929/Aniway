// Helper function to build the prompt for replanning a single day\'s itinerary
export function buildReplanDayItineraryPrompt(
  newlyAddedLocation,
  existingDayItinerary,
  originalUserRequest
) {
  const date = existingDayItinerary.date; // The specific date to replan

  // Format existing itinerary items for the prompt to give context to the AI
  let existingItineraryString =
    "No existing itinerary items were planned for this day.";
  if (
    existingDayItinerary.itinerary &&
    existingDayItinerary.itinerary.length > 0
  ) {
    existingItineraryString =
      "Previously planned items for this day. If you choose to include any of these, you MUST ensure you can provide all required details (name, lat, lng, and a non-empty addresses array with actual address strings). If an existing item lacks these details in the input, and you cannot confidently find them (e.g., using its Google Place ID if available), then that item MUST BE OMITTED from the new plan. Available details for existing items are:\\\\n";
    existingItineraryString += existingDayItinerary.itinerary
      .map((item, index) => {
        let placeInfo = `  - Item ${index + 1}:`;
        if (item.name) placeInfo += ` Name: \\"${item.name}\\".`;
        else placeInfo += ` Name: Not specified.`;
        if (item.lat !== undefined && item.lng !== undefined)
          placeInfo += ` Lat/Lng: ${item.lat}, ${item.lng}.`;
        else placeInfo += ` Lat/Lng: Not specified.`;
        if (item.addresses && item.addresses.length > 0 && item.addresses[0])
          placeInfo += ` Address: \\"${item.addresses[0]}\\".`;
        else placeInfo += ` Address: Not specified.`;
        if (item.gpPlaceId) placeInfo += ` Google Place ID: ${item.gpPlaceId}.`;
        else placeInfo += ` Google Place ID: Not specified.`;
        if (item.note) placeInfo += ` Original note: \\"${item.note}\\".`;
        if (item.arrivalTime)
          placeInfo += ` Original arrival time: ${item.arrivalTime}.`;
        return placeInfo;
      })
      .join("\\\\n");
  }

  // Format the newly added location details for the prompt
  // Ensure newlyAddedLocation and its properties are defined before accessing them
  const newLocationName = newlyAddedLocation?.name || "The new location";
  const newLocationLat = newlyAddedLocation?.lat || "Not specified";
  const newLocationLng = newlyAddedLocation?.lng || "Not specified";
  const newLocationAddress =
    newlyAddedLocation?.addresses && newlyAddedLocation.addresses.length > 0
      ? newlyAddedLocation.addresses[0]
      : "Not specified";
  const newLocationAnimeName = newlyAddedLocation?.animeName || "Not specified";

  const newLocationString = `
A "Newly Added Location" that MUST be included in the new plan for ${date}:
- Name: ${newLocationName}
- Latitude: ${newLocationLat}
- Longitude: ${newLocationLng}
- Primary Address: ${newLocationAddress}
- Potentially related to Anime: ${newLocationAnimeName}
`;

  return `You are an expert travel itinerary planner. Your task is to create a revised and optimized one-day travel plan for the date: ${date}.

Please consider all the following information:
1.  The User\\\'s Original Overall Travel Request: \\"${originalUserRequest}\\" (This is the **PRIMARY SOURCE** for determining the required anime theme, specific locations mentioned by the user, and the overall time range for the itinerary. Adhere to it strictly.)
2.  ${newLocationString} (This location **MUST** be integrated into the itinerary. Use its provided name, latitude, longitude, and primary address in your output for this specific item.)
3.  ${existingItineraryString}

Based on all this, generate a new, complete, and realistic itinerary for the entire day of ${date}.
Key requirements for the new itinerary:
-   **Strict Anime Focus:** The itinerary MUST focus **exclusively** on locations and activities related to the anime specified in the "User\\\'s Original Overall Travel Request" and/or the "Newly Added Location\\\'s" anime context (i.e., \\"${newLocationAnimeName}\\"). Do NOT include generic tourist spots or locations from other anime unless explicitly requested by the user in their "Original Overall Travel Request".
-   **Full Time Adherence & Thematic Expansion:**
    *   The itinerary MUST cover the **entire time range** specified or clearly implied in the "User\\\'s Original Overall Travel Request" (e.g., if "9 AM to 12 AM (midnight)" is requested, plan activities from approximately 09:00 to 24:00 for the date ${date}).
    *   To ensure the day is well-filled and thematically consistent, you are expected to propose additional REAL, VERIFIABLE locations/activities. These suggestions MUST be directly relevant to the anime theme and location context derived from the "User\\\'s Original Overall Travel Request" and/or the "Newly Added Location\\\'s" anime context.
    *   For any such newly suggested item, you MUST provide all **Mandatory Data** (name, lat, lng, non-empty addresses array with actual address strings). If you cannot find enough theme-relevant, verifiable items with complete details to fill the requested time, prioritize accuracy and verifiability for the items you do include. Do NOT invent details or locations.
-   **Mandatory Data for ALL Itinerary Items (including "Newly Added Location", "Previously Planned Items", and any newly suggested by you):**
    *   **CRITICAL:** Every single item in the final "itinerary" array of your JSON output MUST have accurate and non-null values for "name", "lat", "lng", and "addresses".
    *   The "addresses" field MUST be an array containing at least one actual, verifiable address string (e.g., ["123 Main St, Tokyo, Japan"]). It CANNOT be \\\`[null]\\\` or an empty array \\\`[]\\\`.
    *   **"Newly Added Location" Specifics:** You MUST use its provided name (\\"${newLocationName}\\"), latitude (${newLocationLat}), longitude (${newLocationLng}), and primary address (\\"${newLocationAddress}\\") verbatim for its entry. These details are guaranteed to be provided.
    *   **"Previously Planned Items" Specifics:** If you choose to include any of these, they MUST also meet all **CRITICAL** data requirements above. If an existing item lacks these complete details in the input, and you cannot confidently find them (e.g., using its Google Place ID if available and it yields complete, verifiable data), then that item MUST BE OMITTED from the new plan.
-   **NO Generic/Invented Fillers:** Do NOT invent anime-themed locations (e.g., "Clannad Exhibition," "Anime Cafe") or add generic meal stops (e.g., "Lunch," "Dinner") unless they are specific, named, theme-relevant establishments for which you can provide all required details (name, lat, lng, addresses). If the user\\'s request implies meals but no specific themed restaurant is suitable and verifiable, omit the meal slot.
-   **Logical Flow and Quality:** The schedule must be logical: arrange activities for morning, noon, and evening within the specified time range. Consider travel time between locations. Locations should be ordered in a geographically sensible way. Arrival times for each activity must be reasonable and sequential. Prioritize a shorter, accurate, verifiable itinerary over a longer one with incomplete or speculative items.

You MUST strictly output your response as a single, valid JSON object. Do NOT include any text, explanations, or markdown formatting outside of this JSON object. The JSON structure must be exactly as follows:
{
  "date": \\"${date}\\",
  "index": ${
    existingDayItinerary.index !== undefined ? existingDayItinerary.index : 0
  },
  "itinerary": [
    {
      "gpPlaceId": "GOOGLE_PLACE_ID_IF_YOU_CAN_DETERMINE_IT_ELSE_NULL",
      "name": "NAME_OF_THE_PLACE_OR_ACTIVITY",
      "lat": LATITUDE_MUST_BE_A_VALID_NUMBER,
      "lng": LONGITUDE_MUST_BE_A_VALID_NUMBER,
      "addresses": ["PRIMARY_ADDRESS_STRING_MUST_BE_NON_NULL_IN_ARRAY"],
      "order": 1,
      "arrivalTime": "HH:MM",
      "note": "Brief note about the activity or visit."
    }
    // ... potentially more itinerary items for the day
  ]
}

Important rules for the JSON output:
- The "date" field in the output must be exactly \\"${date}\\".
- The "index" field should be ${
    existingDayItinerary.index !== undefined ? existingDayItinerary.index : 0
  }.
- For each item in the "itinerary" array:
    - "gpPlaceId": Provide the Google Place ID if known or if you can confidently determine it. If not, use null. This field is secondary; "lat", "lng", "addresses" are mandatory and primary.
    - "name": Provide a clear, specific, verifiable name. **For the \\'Newly Added Location\\', use its provided name: \\"${newLocationName}\\".**
    - "lat": Provide the verifiable latitude. This field MUST be a valid number and CANNOT be null. **For the \\'Newly Added Location\\', use its provided latitude: ${newLocationLat}.**
    - "lng": Provide the verifiable longitude. This field MUST be a valid number and CANNOT be null. **For the \\'Newly Added Location\\', use its provided longitude: ${newLocationLng}.**
    - "addresses": Provide an array with at least one verifiable primary address string. This field CANNOT be \\\`[null]\\\` or an empty array \\\`[]\\\`. **For the \\'Newly Added Location\\', use its provided primary address: \\"${newLocationAddress}\\".**
    - "order": Must be a sequential integer starting from 1 for the day\\\'s activities.
    - "arrivalTime": Must be in "HH:MM" format (e.g., "09:00", "14:30").
    - "note": A concise and helpful note.
- Plan a full day according to the "Time Adherence" rule above.
- Remember: Your entire response must be ONLY the JSON object, with no surrounding text or markdown formatting like \\\\\`\\\\\`\\\\\`json or \\\\\`\\\\\`\\\\\`.
`;
}
