import apiClient from "../util/api";

export async function fetchPlaceDetails(placeId) {
  if (!placeId || placeId.length < 5) {
    throw new Error("Invalid place ID");
  }

  try {
    const res = await apiClient.get(`/api/gmap/place_by_id/${placeId}`);
    return res.data;
  } catch (err) {
    console.error(`❌ fetchPlaceDetails failed for ${placeId}:`, err.message);
    throw err;
  }
}
