import apiClient from "../util/api";

export async function fetchPlacePhoto(photoReference) {
  if (!photoReference || photoReference.length < 5) {
    return null;
  }

  const cacheKey = `placePhotoDataURL_${photoReference}`;

  // Check localStorage first
  const cachedDataURL = localStorage.getItem(cacheKey);
  if (cachedDataURL) {
    return cachedDataURL;
  }

  try {
    const res = await apiClient.post(
      `/api/gmap/photo`,
      { photo_reference: photoReference },
      { responseType: "blob" }
    );

    return new Promise((resolve, reject) => {
      if (!(res.data instanceof Blob)) {
        console.error("fetchPlacePhoto: Fetched data is not a Blob", res.data);
        try {
          const errorText =
            typeof res.data === "object"
              ? JSON.stringify(res.data)
              : String(res.data);
          reject(
            new Error(
              `Expected a Blob but received: ${errorText.substring(0, 100)}`
            )
          );
        } catch (err) {
          console.error("fetchPlacePhoto: Error parsing response data:", err);
          reject(
            new Error("Expected a Blob but received non-Blob, non-JSON data.")
          );
        }
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        localStorage.setItem(cacheKey, base64data);
        resolve(base64data);
      };
      reader.onerror = (error) => {
        console.error(
          `❌ fetchPlacePhoto: FileReader error for ${photoReference}:`,
          error
        );
        reject(error); // Propagate FileReader error
      };
      reader.readAsDataURL(res.data);
    });
  } catch (err) {
    console.error(
      `❌ fetchPlacePhoto API call failed for ${photoReference}:`,
      err.response ? err.response.data : err.message // Log more detailed error if available
    );
    return null;
  }
}
