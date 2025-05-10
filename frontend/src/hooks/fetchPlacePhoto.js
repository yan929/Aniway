import apiClient from "../util/api";

// In-memory cache for photo blobs
const photoBlobCache = new Map();

export async function fetchPlacePhoto(photoReference) {
  if (!photoReference || photoReference.length < 5) {
    throw new Error("Invalid place ID");
  }

  // Check cache first
  if (photoBlobCache.has(photoReference)) {
    console.log(
      "fetchPlacePhoto: Serving photo from cache for reference:",
      photoReference
    );
    const cachedBlob = photoBlobCache.get(photoReference);
    return URL.createObjectURL(cachedBlob);
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

    const imageBlob = new Blob([res.data], { type: "image/jpeg" });
    // Store the fetched blob in cache
    photoBlobCache.set(photoReference, imageBlob);

    const imageUrl = URL.createObjectURL(imageBlob);
    return imageUrl;
  } catch (err) {
    console.error(
      `❌ fetchPlacePhoto failed for ${photoReference}:`,
      err.message
    );
    throw err;
  }
}
