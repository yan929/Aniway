import apiClient from "../util/api";

export async function fetchPlaceByLatLng(keyword, lat, lng) {
  try {
    const res = await apiClient.get("/api/gmap/place_by_nearby", {
      params: { keyword, lat, lng },
    });
    return res.data;
  } catch (err) {
    console.error("❌ Failed to fetch place info:", err.message);
    throw err;
  }
}
