import { useState, useEffect } from "react";
import { fetchPlaceDetails } from "./fetchPlaceDetail";

function useMapLocationsLoader(tripData) {
  const [mapLocations, setMapLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [displayMessage, setDisplayMessage] = useState(null);

  useEffect(() => {
    const loadMapData = async () => {
      setIsLoading(true);
      setDisplayMessage(null);
      setMapLocations([]);

      if (!tripData || !Array.isArray(tripData) || tripData.length === 0) {
        setDisplayMessage(
          "Map is ready. Add locations to your trip to see them here."
        );
        setIsLoading(false);
        return;
      }

      const allItineraryItems = tripData.reduce((acc, day) => {
        if (day && Array.isArray(day.itinerary)) {
          return acc.concat(day.itinerary);
        }
        return acc;
      }, []);

      const itemsWithPlaceId = allItineraryItems.filter(
        (item) => item && item.gpPlaceId
      );

      if (itemsWithPlaceId.length === 0) {
        if (tripData.length > 0) {
          setDisplayMessage(
            "No items with place IDs in your trip to display on map."
          );
        } else {
          setDisplayMessage(
            "Map is ready. Add locations to your trip to see them here."
          );
        }
        setIsLoading(false);
        return;
      }

      const promises = itemsWithPlaceId.map(async (item) => {
        try {
          const details = await fetchPlaceDetails(item.gpPlaceId);
          if (
            details &&
            details.name &&
            details.geometry &&
            details.geometry.location
          ) {
            return {
              id: item.gpPlaceId,
              lat: details.geometry.location.lat,
              lng: details.geometry.location.lng,
              label: details.name,
            };
          }
          console.warn(
            `[useMapLocationsLoader] Invalid or missing data for placeId ${item.gpPlaceId}. Response:`,
            details
          );
          return null;
        } catch (err) {
          console.error(
            `[useMapLocationsLoader] Failed to fetch details for placeId ${item.gpPlaceId}:`,
            err
          );
          return null;
        }
      });

      try {
        const results = await Promise.all(promises);
        const validLocations = results.filter((location) => location !== null);
        setMapLocations(validLocations);

        if (itemsWithPlaceId.length > 0 && validLocations.length === 0) {
          setDisplayMessage(
            "No valid map locations found. The backend API might be experiencing issues, or the place details are unavailable for the items in your trip."
          );
        } else if (validLocations.length > 0) {
          setDisplayMessage(null);
        }
      } catch (err) {
        console.error(
          "[useMapLocationsLoader] Error processing location details promises:",
          err
        );
        setDisplayMessage(
          "Failed to process map locations due to a system error."
        );
        setMapLocations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMapData();
  }, [tripData]);

  return { mapLocations, isLoading, displayMessage };
}

export default useMapLocationsLoader;
