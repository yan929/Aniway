// import axios from 'axios';
const axios = require('axios');

// get place details by place_id
exports.getPlaceDetails = async (placeId) => {
  // check if there is a cached version
  // const cachedData = cache.get(placeId);
  // if (cachedData) return cachedData;

  const GOOGLE_API_HOST = process.env.GOOGLE_API_HOST;
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const GMAP_PLACE_DETAILS_ENDPOINT = `${GOOGLE_API_HOST}/place/details/json`;


  // call Google API
  const params = new URLSearchParams({
    place_id: placeId,
    key: GOOGLE_API_KEY,
    fields: 'name,formatted_address,geometry,rating,photos' // add any other fields you need
  });

  console.log('🧠 Fetching Place ID:', placeId);
  console.log('🌐 Final Request URL:', `${GMAP_PLACE_DETAILS_ENDPOINT}?${params.toString()}`);

  try {
    const response = await axios.get(`${GMAP_PLACE_DETAILS_ENDPOINT}?${params.toString()}`);

    if (response.data.status !== 'OK') {
      throw new Error(response.data.error_message || 'Google API error');
    }

    // // cache the result for 1 hour
    // cache.set(placeId, response.data.result, 3600);
    return response.data.result;

  } catch (error) {
    throw new Error(`Failed to fetch place details: ${error.message}`);
  }
};

