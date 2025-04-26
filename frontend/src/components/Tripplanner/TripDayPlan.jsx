import React from "react";
import dayjs from "dayjs";
import usePlaceDetails from "../../hooks/usePlaceDetails.js";
import SearchBar from "../Search/search.jsx";
import { AppContext } from "../../AppContextProvider.jsx";
import { useContext } from "react";
import { fetchPlaceByLatLng } from "../../hooks/fetchPlaceByLatLng.js";
import ItineraryItem from "./ItineraryItem.jsx";

export default function TripDayPlan({ day, index }) {
  const placeDetailsMap = usePlaceDetails(day.itinerary);

  const { tripData, updateItinerary } = useContext(AppContext);

  const handleAddLocationToDay = async (loc) => {
    console.log("✅ Selected Location from SearchBar:", loc);

    const newPlaceData = await fetchPlaceByLatLng(loc.lat, loc.lng);
    const testUpdateItem = {
      date: "2025-10-01",
      gpPlaceId: "ChIJCewJkL2LGGAR3Qmk0vCTGkg",
      order: 3,
    };
    const newTripData = updateItinerary(tripData, testUpdateItem);
    console.log("✅ newPlace:", newPlaceData);
    console.log("✅ newPlace placeID:", newPlaceData.place_id);
  };

  return (
    <>
      <div className="flex items-center gap-6 text-[1.375rem] font-semibold text-gray-800">
        <span>Day {index + 1}</span>
        <span>{dayjs(day.date).format("dddd, MMMM D")}</span>
      </div>

      <div className="flex flex-col gap-2 mt-4 text-[1.375rem] font-semibold text-gray-800">
        {day.itinerary.map((item, itemIndex) => (
          <ItineraryItem
            key={itemIndex}
            item={item}
            detail={placeDetailsMap[item.gpPlaceId]}
            itemIndex={itemIndex}
          />
        ))}
      </div>
      <div className="mt-6 w-full max-w-2xl">
        <SearchBar onLocationSelected={handleAddLocationToDay} />
      </div>
    </>
  );
}
