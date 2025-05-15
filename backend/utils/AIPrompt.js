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

export function buildItineraryPrompt(prompt, startDate, endDate) {
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

// Helper to build the prompt for the initial information extraction LLM call
export function buildExtractionPrompt(userPrompt) {
  console.log(`DEBUG: Building extraction prompt for: "${userPrompt}"`);
  return `Extract destination, interests, budget, start date, and end date from the user prompt. 
**Crucially:** If a specific anime, manga, or movie title (like 'Your Name', 'Spirited Away', 'Naruto') is mentioned as an interest, extract that **exact title**. Do NOT extract the general word 'anime' if a specific title is given.
Format output strictly as JSON: {"destination": "...", "interests": ["...", "..."], "budget": "...", "startDate": "YYYY-MM-DD or null", "endDate": "YYYY-MM-DD or null"}.
Example: User says "Trip to Tokyo, I like Your Name." -> JSON should have "interests": ["Your Name"]
User Prompt: "${userPrompt}"`;
}

export function buildArgumentSystemPrompt(startDate) {
  return {
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
      startDate +
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
}

export function buildJsonConversionSystemPrompt({
  extractedInfo,
  retrievedPlaces,
}) {
  return {
    role: "system",
    content: `You are a data conversion assistant. Parse the provided Markdown travel itinerary, which is focused on Japanese anime tourism, and convert it STRICTLY into a JSON object matching the structure below. Generate a title based on the whole trip as the 'title' field in the JSON object, no more than 50 characters including spaces, reflecting the anime theme of the trip if possible (e.g., "Anime Pilgrimage to Tokyo", "Exploring Akihabara").\n\n
          **Date Handling Instructions:**\n
          1. The **required format** for the 'date' field is **'YYYY-MM-DD'**. \n
          2. Use the provided 'Start Date' (${
            extractedInfo.startDate
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
  };
}

export function buildUserQueryPrompt(prompt, startDate, endDate) {
  return `You are a travel request analyzer.
Your task:
- Carefully extract any locations (e.g., cities, places, landmarks).
- Identify any specific anime, manga, or movie titles mentioned (e.g., "Your Name", "Attack on Titan", "Haruhi Suzumiya", "Suzumiya Haruhi").
- If the user provides short phrases or single words (e.g., "sound", "ghost", "journey to the west"), and they seem like they could be part of an anime/manga/movie title or a significant keyword related to one, list them as potential titles. Treat standalone nouns or thematic words as potential titles if they could plausibly relate to an anime series.
- Extract any *other* general themes (e.g., nature, culture, specific genre like "sci-fi" or "fantasy") if mentioned separately from titles or keywords.

Strict output:
You must strictly return the result in the following JSON format:

{
  "locations": [
    { "index": 1, "location": "..." }
    // ... more locations
  ],
  "potential_titles": [
    { "index": 1, "title": "..." } 
    // ... more titles/keywords found
  ],
  "other_themes": [
     { "index": 1, "theme": "..." }
     // ... more general themes
  ],
  "startDate": "${startDate}",
  "endDate": "${endDate}"
}

Important rules:
- If no locations are found, return an empty "locations" array: []
- If no titles or title-like keywords are found, return an empty "potential_titles" array: []
- If no other themes are found, return an empty "other_themes" array: []
- You must include "startDate" and "endDate" exactly as provided above.
- Do not invent new locations, titles, or themes.
- Extract only what is mentioned or reasonably implied by the user's input, especially for shorter queries.
- Output only the JSON and nothing else.
- Do not explain anything outside of the JSON.

User Request: "${prompt}"
`;
}

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
