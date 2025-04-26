import axios from "axios";

const GOOGLE_API_HOST = "https://maps.googleapis.com/maps/api";
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

const fetchPlaceNearby = async (req, res) => {
  const {keyword, lat, lng } = req.query;
  console.log("keyword:",keyword,"lat:", lat, "lng:", lng);

  try {
    const nearbyRes = await axios.get(
      `${GOOGLE_API_HOST}/place/nearbysearch/json?keyword=${keyword}&location=${lat},${lng}&radius=1500&key=${process.env.GOOGLE_API_KEY}`
    );
    const nearbyData = nearbyRes.data;

    if (!nearbyData.results || nearbyData.results.length === 0) {
      return res.status(404).json({ error: "No nearby places found" });
    }

    const placeId = nearbyData.results[0].place_id;
    console.log("backend placeId:", placeId);
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
    res.status(500).json({ error: "Failed to get nearby places" });
  }
};

export { fetchPlaceInfo, fetchPlacePhoto, fetchPlaceNearby };
