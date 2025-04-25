import axios from "axios";

// get place details by place_id
export const getPlaceDetails = async (placeId) => {
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
    fields:
      "name,formatted_address,geometry,rating,photos,opening_hours,editorial_summary,formatted_phone_number", // add any other fields you need
  });

  try {
    const response = await axios.get(GMAP_PLACE_DETAILS_ENDPOINT, { params });

    if (response.data.status !== "OK") {
      throw new Error(response.data.error_message || "Google API error");
    }

    // // cache the result for 1 hour
    // cache.set(placeId, response.data.result, 3600);
    // return response.data.result;
  } catch (error) {
    throw new Error(`Failed to fetch place details: ${error.message}`);
  }
};
