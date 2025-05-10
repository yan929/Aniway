import apiClient from "../util/api";

export async function fetchPlacePhoto(photoReference) {
  if (!photoReference || photoReference.length < 5) {
    throw new Error("Invalid place ID");
  }

  try {
    console.log(
      "fetchPlacePhoto: Fetching photo for reference:",
      photoReference
    );
    const res = await apiClient.get(
      `/api/gmap/photo?photo_reference=${photoReference}`,
      {
        responseType: "blob",
      }
    );
    //http://localhost:5050/api/gmap/photo?photo_reference=AeeoHcIS...

    const imageUrl = URL.createObjectURL(
      new Blob([res.data], { type: "image/jpeg" })
    );
    return imageUrl;
  } catch (err) {
    console.error(
      `❌ fetchPlacePhoto failed for ${photoReference}:`,
      err.message
    );
    throw err;
  }
}
