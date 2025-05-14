import axios from "axios";

const GOOGLE_API_HOST = "https://maps.googleapis.com/maps/api";

// New service function for core logic of fetching nearby place details
async function getNearbyPlaceDetailsService(lat, lng, keyword = null) {
  let nearbyUrl = `${GOOGLE_API_HOST}/place/nearbysearch/json?location=${lat},${lng}&radius=30&key=${process.env.GOOGLE_API_KEY}`;
  if (keyword) {
    nearbyUrl += `&keyword=${encodeURIComponent(keyword)}`;
  }
  // console.log("[Service] nearbyUrl (initial attempt):", nearbyUrl);

  let nearbyRes = await axios.get(nearbyUrl);
  console.log("[Service] response status:", nearbyRes.status);
  let operationalResults = [];
  if (nearbyRes.status === 200) {
    let nearbyData = nearbyRes.data;
    operationalResults =
      nearbyData.results?.filter(
        (result) => result.business_status === "OPERATIONAL"
      ) || [];
  }

  // Fallback if no operational results (not just if results is empty)
  if (!operationalResults.length) {
    console.log(
      "[Service] No operational results with keyword, trying without keyword."
    );
    nearbyUrl = `${GOOGLE_API_HOST}/place/nearbysearch/json?location=${lat},${lng}&radius=1500&key=${process.env.GOOGLE_API_KEY}`;
    nearbyRes = await axios.get(nearbyUrl);
    nearbyData = nearbyRes.data;
    operationalResults =
      nearbyData.results?.filter(
        (result) => result.business_status === "OPERATIONAL"
      ) || [];
    if (!operationalResults.length) {
      const error = new Error("No operational nearby places found.");
      error.statusCode = 404;
      throw error;
    }
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
    console.log("[Service] detailsRes:", detailsRes);

    if (!detailsRes || !detailsRes.data || !detailsRes.data.result) {
      return res.status(404).json({ error: "Place not found" });
    }
    const details = detailsRes.data.result;

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

const fetchPlaceNearby = async (req, res) => {
  const { keyword, lat, lng } = req.query;
  try {
    const placeDetails = await getNearbyPlaceDetailsService(lat, lng, keyword);
    res.json(placeDetails);
  } catch (err) {
    console.error("[Route Handler] Error in fetchPlaceNearby:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export {
  fetchPlaceInfo,
  fetchPlacePhoto,
  fetchPlaceNearby,
  getNearbyPlaceDetailsService,
}; // Export the new service function
