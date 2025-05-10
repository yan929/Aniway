import { useEffect, useState } from "react";
import { fetchPlacePhoto } from "../hooks/fetchPlacePhoto";

export default function usePlacePhoto(photoReference = "") {
  const [photoURL, setPlacePhoto] = useState(null);

  useEffect(() => {
    let newPhotoURL = null;
    const fetchPhoto = async () => {
      try {
        const url = await fetchPlacePhoto(photoReference);
        let newPhotoURL = url;
        setPlacePhoto(newPhotoURL);
      } catch (err) {
        console.error("Failed to fetch place photo:", err);
        setPlacePhoto(null);
      }
    };

    if (photoReference.length > 0) {
      fetchPhoto();
    }

    // Clean up the object URL when the component unmounts or photoReference changes to avoid memory leaks
    return () => {
      if (newPhotoURL) {
        URL.revokeObjectURL(newPhotoURL);
      }
    };
  }, [photoReference]);

  return photoURL;
}
