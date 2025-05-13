import { useEffect, useState } from "react";
import { fetchPlacePhoto } from "../hooks/fetchPlacePhoto";

export default function usePlacePhoto(photoReference = "") {
  const [photoURL, setPlacePhoto] = useState(null);

  useEffect(() => {
    const fetchPhotoAsync = async () => {
      try {
        const url = await fetchPlacePhoto(photoReference);
        setPlacePhoto(url);
      } catch (err) {
        console.error("usePlacePhoto: Failed to fetch place photo:", err);
        setPlacePhoto(null);
      }
    };

    if (photoReference && photoReference.length > 0) {
      fetchPhotoAsync();
    } else {
      setPlacePhoto(null);
    }

    return () => {};
  }, [photoReference]);

  return photoURL;
}
