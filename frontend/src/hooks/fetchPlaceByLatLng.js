import axios from "axios";

export async function fetchPlaceByLatLng(lat, lng) {
    try {
        const res = await axios.post("/api/gmap/", { lat, lng });
        return res.data;
    } catch (err) {
        console.error("❌ Failed to fetch place info:", err.message);
        throw err;
    }
}