import axios from "axios";

const GOOGLE_API_HOST = "https://maps.googleapis.com/maps/api";

// New service function for core logic of fetching nearby place details
async function getNearbyPlaceDetailsService(lat, lng, keyword = null) {
  console.log("[Service] keyword:", keyword, "lat:", lat, "lng:", lng);

  let nearbyUrl = `${GOOGLE_API_HOST}/place/nearbysearch/json?location=${lat},${lng}&radius=1500&key=${process.env.GOOGLE_API_KEY}`;
  if (keyword) {
    nearbyUrl += `&keyword=${encodeURIComponent(keyword)}`;
  }
  // console.log("[Service] nearbyUrl (initial attempt):", nearbyUrl);

  let nearbyRes = await axios.get(nearbyUrl);
  let nearbyData = nearbyRes.data;

  // If initial search (with or without keyword) yields no results, try a tighter radius without keyword
  if (!nearbyData.results || nearbyData.results.length === 0) {
    console.log(
      "[Service] Initial nearby search failed or returned no results. Trying fallback (no keyword, radius 10m)."
    );
    nearbyUrl = `${GOOGLE_API_HOST}/place/nearbysearch/json?location=${lat},${lng}&radius=10&key=${process.env.GOOGLE_API_KEY}`;
    // console.log("[Service] nearbyUrl (fallback):", nearbyUrl);
    nearbyRes = await axios.get(nearbyUrl);
    nearbyData = nearbyRes.data;

    if (!nearbyData.results || nearbyData.results.length === 0) {
      // Throw an error or return a specific indicator if no places are found even with fallback
      const error = new Error(
        "No nearby places found even with fallback search."
      );
      error.statusCode = 404;
      throw error;
    }
  }

  const operationalResults = nearbyData.results.filter((result) => {
    return result.business_status === "OPERATIONAL";
  });

  if (operationalResults.length === 0) {
    // If no *operational* places, but there were results, this might be different from a 404 "no places found at all"
    const error = new Error("No operational nearby places found.");
    // You might use a different status code or error type to distinguish this case if needed
    error.statusCode = 404; // Or perhaps a custom code
    throw error;
  }

  const firstResult = operationalResults[0];
  const placeId = firstResult.place_id;
  // console.log("[Service] backend placeId:", placeId);

  const detailsRes = await axios.get(
    `${GOOGLE_API_HOST}/place/details/json?place_id=${placeId}&fields=name,formatted_address,opening_hours,rating,user_ratings_total,photos,website,geometry,formatted_phone_number,address_components&key=${process.env.GOOGLE_API_KEY}`
  );
  const detailsData = detailsRes.data;
  const details = detailsData.result;

  if (!details) {
    const error = new Error(`Failed to get details for place_id: ${placeId}`);
    error.statusCode = 404; // Or 500 if it's unexpected
    throw error;
  }

  // Extract city from address_components
  let city = null;
  if (details.address_components) {
    const cityComponent = details.address_components.find((comp) =>
      comp.types.includes("locality")
    );
    if (cityComponent) {
      city = cityComponent.long_name;
    }
  }

  return {
    name: details.name,
    address: details.formatted_address,
    phone: details.formatted_phone_number,
    rating: details.rating,
    total_ratings: details.user_ratings_total,
    website: details.website,
    open_now: details.opening_hours?.open_now,
    opening_hours: details.opening_hours?.weekday_text,
    location: details.geometry?.location,
    photo_reference: details.photos?.[0]?.photo_reference,
    place_id: placeId,
    city: city, // Added city
  };
}

const fetchPlaceInfo = async (req, res) => {
  const { lat, lng } = req.body;

  try {
    // Step 1: Geocode to get place_id
    const geoRes = await axios.get(
      `${GOOGLE_API_HOST}/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_API_KEY}`
    );
    const geoData = geoRes.data;
    const result = geoData.results[0];
    const placeId = result.place_id;

    // Step 2: Get place details
    const detailsRes = await axios.get(
      `${GOOGLE_API_HOST}/place/details/json?place_id=${placeId}&fields=name,formatted_address,opening_hours,rating,user_ratings_total,photos,website,geometry,formatted_phone_number&key=${process.env.GOOGLE_API_KEY}`
    );
    const detailsData = detailsRes.data;
    const details = detailsData.result;

    res.json({
      name: details.name,
      address: details.formatted_address,
      phone: details.formatted_phone_number,
      rating: details.rating,
      total_ratings: details.user_ratings_total,
      website: details.website,
      open_now: details.opening_hours?.open_now,
      opening_hours: details.opening_hours?.weekday_text,
      location: details.geometry?.location,
      photo_reference: details.photos?.[0]?.photo_reference,
      place_id: placeId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get detailed place info" });
  }
};

const fetchPlacePhoto = async (req, res) => {
  const { photo_reference } = req.body;

  if (!photo_reference) {
    return res.status(400).json({ error: "photo_reference is required" });
  }

  const photoUrl = `${GOOGLE_API_HOST}/place/photo?maxwidth=400&photoreference=${photo_reference}&key=${process.env.GOOGLE_API_KEY}`;

  try {
    const response = await axios.get(photoUrl, { responseType: "arraybuffer" });
    const incoming_picture = response.data;
    res.set("Content-Type", "image/jpeg");
    res.send(Buffer.from(incoming_picture));
  } catch (err) {
    console.error("Error fetching photo:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const fetchPlaceNearby = async (req, res, next) => {
  const { keyword, lat, lng } = req.query;
  try {
    const placeDetails = await getNearbyPlaceDetailsService(lat, lng, keyword);
    res.json(placeDetails);
  } catch (err) {
    // Pass the error to the centralized error handler
    // console.error("[Route Handler] Error in fetchPlaceNearby:", err.message);
    next(err);
  }
};

export {
  fetchPlaceInfo,
  fetchPlacePhoto,
  fetchPlaceNearby,
  getNearbyPlaceDetailsService,
}; // Export the new service function
