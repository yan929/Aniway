import React from "react";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import usePlaceDetails from "../../hooks/usePlaceDetails.js";
import SearchBar from "../Search/search.jsx";
import { AppContext } from "../../context/AppContext.jsx";
import { useContext } from "react";
import { fetchPlaceByLatLng } from "../../hooks/fetchPlaceByLatLng.js";
import ItineraryItem from "./ItineraryItem.jsx";
import SmartAdviceWindow from "./SmartAdviceWindow.jsx";

export default function TripDayPlan({ day, index }) {
  const placeDetailsMap = usePlaceDetails(day.itinerary);
  const { currentTrip, updateItinerary, deleteTripItem, selectDay } =
    useContext(AppContext);
  const [tripItems, setTripItems] = useState(day.itinerary);
  const [isOpen, setIsOpen] = useState(false);

  // When this component mounts, set this day as the selected day in context
  useEffect(() => {
    selectDay(day);
  }, [day, selectDay]);

  // Update local state when day itinerary changes
  useEffect(() => {
    setTripItems(day.itinerary);
  }, [day.itinerary]);

  // Function to handle drag-and-drop reordering of itinerary items
  const moveItem = (from, to) => {
    if (from === to) return;
    const updatedItems = [...tripItems]; // Use a new name to avoid confusion with component state 'tripItems'
    const [moved] = updatedItems.splice(from, 1);
    updatedItems.splice(to, 0, moved);
    setTripItems(updatedItems); // Update local state for immediate UI feedback

    // Update global state via AppContext
    updateItinerary(day.date, updatedItems); // Persist the reordered items
  };

  // Function to add a new location to the day's itinerary
  const handleAddLocationToDay = async (loc) => {
    try {
      const newPlaceData = await fetchPlaceByLatLng(
        loc.label,
        loc.lat,
        loc.lng
      );

      // Find the current day's data from currentTrip to get the most up-to-date itinerary
      // This is important if other operations might have modified it in context
      const currentDayData =
        currentTrip && currentTrip.content
          ? currentTrip.content.find((d) => d.date === day.date)
          : day;
      const currentItinerary = currentDayData ? currentDayData.itinerary : [];

      const newItem = {
        // date: day.date, // date is part of the day object, not needed in item for new model
        gpPlaceId: newPlaceData.place_id,
        order: currentItinerary.length, // Order based on the current length of items for the day
        // arrivalTime and note can be added here if defaults are desired or they come from newPlaceData
        arrivalTime: "12:00", // Example default
        note: "", // Example default
      };

      const newItemsArray = [...currentItinerary, newItem];
      updateItinerary(day.date, newItemsArray); // Call with day.date and the new full array of items
    } catch (error) {
      console.error("Error adding location to day:", error);
    }
  };

  // Function to delete an itinerary item
  const handleDelete = (item) => {
    deleteTripItem(day, item);
  };

  return (
    <>
      <div className="flex items-center gap-6 text-[1.375rem] font-semibold text-gray-800">
        <span>Day {index + 1}</span>
        <span>{dayjs(day.date).format("dddd, MMMM D")}</span>
        <button
          className="mt-auto bg-orange-400 text-black rounded-full py-1 px-4 text-[1rem] hover:bg-orange-300"
          onClick={() => setIsOpen(true)}
        >
          Smart advice
        </button>
        <SmartAdviceWindow
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          day={day}
        />
      </div>
      <div className="flex flex-col gap-2 mt-4 text-[1.375rem] font-semibold text-gray-800">
        {tripItems.map((item, itemIndex) => {
          const detail = placeDetailsMap[item.gpPlaceId];
          return (
            <ItineraryItem
              key={itemIndex}
              item={item}
              detail={detail}
              itemIndex={itemIndex}
              moveItem={moveItem}
              onDelete={handleDelete}
            />
          );
        })}
      </div>
      <div className="mt-6 w-full max-w-2xl">
        {/* Pass the current day index to SearchBar */}
        <SearchBar
          onLocationSelected={handleAddLocationToDay}
          dayIndex={index}
        />
      </div>
    </>
  );
}
