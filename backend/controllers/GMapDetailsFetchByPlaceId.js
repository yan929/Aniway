import PlaceDetails from "../services/GMapPlaceIdService.js";

// 处理Place Details请求
const getPlaceDetails = async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!placeId || placeId.length < 5) {
      return res.status(400).json({ error: "Invalid place_id parameter" });
    }

    const details = await PlaceDetails(placeId);
    res.json(details);
  } catch (error) {
    console.error(`[Place Error] ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};


const fetchPlacePhotoByPlaceId = async (req, res) => {
  const { photo_reference } = req.query;

  if (!photo_reference) {
    return res.status(400).json({ error: "photo_reference is required" });
  }

  const photoUrl = `${process.env.GOOGLE_API_HOST}/place/photo?maxwidth=400&photoreference=${photo_reference}&key=${process.env.GOOGLE_API_KEY}`;

  try {
    const response = await fetch(photoUrl);
    const incoming_picture = await response.arrayBuffer();
    res.set("Content-Type", "image/jpeg");
    res.send(Buffer.from(incoming_picture));
  } catch (err) {
    console.error("Error fetching photo:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { getPlaceDetails, fetchPlacePhotoByPlaceId };