import axios from "axios";

export async function fetchPlaceByLatLng(lat, lng) {
  try {
    const res = await axios.get("/api/gmap/place_by_nearby", {
      params: { lat, lng },
    });
    return res.data;
  } catch (err) {
    console.error("❌ Failed to fetch place info:", err.message);
    throw err;
  }
}
