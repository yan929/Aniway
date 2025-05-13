import { useEffect, useState } from "react";
import apiClient from "../util/api";

function usePlaceDetails(itinerary) {
  const [detailsMap, setDetailsMap] = useState({});

  useEffect(() => {
    if (!Array.isArray(itinerary)) return;

    const fetchDetails = async () => {
      const newMap = {};
      for (const item of itinerary) {
        if (!item.gpPlaceId) continue;
        const cacheKey = `placeDetails_${item.gpPlaceId}`;
        let details = null;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          details = JSON.parse(cached);
          console.log("usePlaceDetails: Using cached details");
        } else {
          try {
            const res = await apiClient.get(
              `/api/gmap/place_by_id/${item.gpPlaceId}`
            );
            details = res.data;
            localStorage.setItem(cacheKey, JSON.stringify(details));
          } catch {
            // handle error silently
          }
        }
        if (details) newMap[item.gpPlaceId] = details;
      }
      setDetailsMap(newMap);
    };

    fetchDetails();
  }, [itinerary]);

  return detailsMap;
}

export default usePlaceDetails;
