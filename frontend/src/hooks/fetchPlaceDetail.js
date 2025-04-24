import axios from 'axios';

export async function fetchPlaceDetails(placeId) {
    if (!placeId || placeId.length < 5) {
        throw new Error('Invalid place ID');
    }

    try {
        const res = await axios.get(`/api/gmap/${placeId}`);
        return res.data;
    } catch (err) {
        console.error(`❌ fetchPlaceDetails failed for ${placeId}:`, err.message);
        throw err;
    }
}