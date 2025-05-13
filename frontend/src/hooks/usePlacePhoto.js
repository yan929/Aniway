import { useEffect, useState } from "react";
import apiClient from "../util/api";

export default function usePlacePhoto(photoReference = "") {
  const [photoURL, setPhotoURL] = useState(null);

  useEffect(() => {
    if (!photoReference) return;

    const cacheKey = `placePhoto_${photoReference}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      console.log("usePlacePhoto: Using cached photo:", cached);
      setPhotoURL(cached);
      return;
    }

    // Fetch from backend
    const fetchPhoto = async () => {
      try {
        const res = await apiClient.get(`/api/gmap/photo_by_reference`, {
          params: { photo_reference: photoReference },
          responseType: "blob",
        });
        const url = URL.createObjectURL(res.data);
        setPhotoURL(url);
        localStorage.setItem(cacheKey, url);
        console.log("usePlacePhoto: Fetched and cached photo:", url);
      } catch {
        // handle error silently
      }
    };

    fetchPhoto();
  }, [photoReference]);

  return photoURL;
}
