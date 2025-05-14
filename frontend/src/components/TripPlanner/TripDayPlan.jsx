import React from "react";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import usePlaceDetails from "../../hooks/usePlaceDetails.js";
import LocSearchBar from "../Search/locSearch.jsx";
import { AppContext } from "../../context/AppContext.jsx";
import { useContext } from "react";
import { fetchPlaceByLatLng } from "../../hooks/fetchPlaceByLatLng.js";
import ItineraryItem from "./ItineraryItem.jsx";
import SmartAdviceWindow from "./SmartAdviceWindow.jsx";
import { useDrop } from "react-dnd";

export default function TripDayPlan({ day, index }) {
  const placeDetailsMap = usePlaceDetails(day.itinerary);
  const {
    currentTrip,
    updateItinerary,
    deleteTripItem,
    selectDay,
    moveItemAcrossDays,
  } = useContext(AppContext);
  const [tripItems, setTripItems] = useState(day.itinerary);
  const [isOpen, setIsOpen] = useState(false);

  const [, drop] = useDrop({
    accept: "ITINERARY_ITEM",
    hover(draggedItem, monitor) {
      if (!monitor.isOver({ shallow: true })) {
        // console.log(`[TripDayPlan ${day.date}] Monitor not over shallowly.`);
        return;
      }
      console.log(`[TripDayPlan ${day.date}] Monitor IS over shallowly.`);

      if (draggedItem.fromDate !== day.date) {
        console.log(
          `[TripDayPlan ${day.date}] Cross-day drag detected. From: ${draggedItem.fromDate}, To: ${day.date}`
        );
        const itemToMove = { ...draggedItem.itemData }; // The item being dragged

        // Call the new atomic function from AppContext
        moveItemAcrossDays(
          draggedItem.fromDate,
          day.date,
          itemToMove,
          tripItems
        );

        // Update the dragged item's source date marker *after* the move is processed
        // This prevents issues if the hover triggers again immediately before the state updates
        draggedItem.fromDate = day.date;
      } else {
        // console.log(`[TripDayPlan ${day.date}] Same-day hover (should be handled by ItineraryItem's drop).`);
      }
    },
  });

  // When this component mounts, set this day as the selected day in context
  useEffect(() => {
    selectDay(day);
  }, [day, selectDay]);

  // Update local state when day itinerary changes from context (e.g., after a drop)
  useEffect(() => {
    // Check if the incoming day.itinerary is different from local tripItems
    // This prevents potential infinite loops if setTripItems itself triggers a context update
    // that then re-triggers this effect.
    if (JSON.stringify(day.itinerary) !== JSON.stringify(tripItems)) {
      setTripItems(day.itinerary);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day.itinerary]);

  // Function to handle drag-and-drop reordering of itinerary items WITHIN the same day
  const moveItem = (from, to) => {
    if (from === to) return;

    const updatedItems = [...tripItems];
    const [moved] = updatedItems.splice(from, 1);
    updatedItems.splice(to, 0, moved);

    // Re-assign order for all items in this day
    const correctlyOrderedItems = updatedItems.map((item, idx) => ({
      ...item,
      order: idx,
    }));

    setTripItems(correctlyOrderedItems); // Update local state for immediate UI feedback
    updateItinerary(day.date, correctlyOrderedItems); // Persist the reordered items
  };

  const handleAddLocationToDay = async (loc) => {
    try {
      const newPlaceData = await fetchPlaceByLatLng(
        loc.label,
        loc.lat,
        loc.lng
      );

      const currentDayData =
        currentTrip && currentTrip.content
          ? currentTrip.content.find((d) => d.date === day.date)
          : day;
      const currentItinerary = currentDayData ? currentDayData.itinerary : [];

      const newItem = {
        gpPlaceId: newPlaceData.place_id,
        order: currentItinerary.length,
        arrivalTime: "12:00",
        note: "",
      };

      const newItemsArray = [...currentItinerary, newItem];
      updateItinerary(day.date, newItemsArray);
    } catch (error) {
      console.error("Error adding location to day:", error);
    }
  };

  const handleDelete = (itemToDelete) => {
    console.log(`[TripDayPlan ${day.date}] handleDelete item:`, itemToDelete);
    deleteTripItem(day, itemToDelete); // Pass the full day object and item object
  };

  return (
    <>
      <div className="flex items-center gap-6 text-[1.375rem] font-semibold  text-gray-800">
        <span className="text-[#626fe3] font-bold">Day {index + 1}</span>
        <span>{dayjs(day.date).format("dddd, MMMM D")}</span>
        <button
          className="ml-auto bg-orange-400 text-black rounded-full py-1 px-4 text-[1rem] hover:bg-orange-300 "
          onClick={() => setIsOpen(true)}
        >
          Smart Advice
        </button>
        <SmartAdviceWindow
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          day={day}
        />
      </div>
      <div
        ref={drop} // Apply the drop connector here
        className={`flex flex-col gap-2 mt-4 text-[1.375rem] font-semibold text-gray-800 
                    min-h-[100px] border-2 border-transparent hover:border-dashed hover:border-blue-400 rounded-md p-2`}
      >
        {tripItems && tripItems.length > 0 ? (
          tripItems.map((item, itemIndex) => {
            if (!item || !item.gpPlaceId) {
              console.warn(
                "[TripDayPlan] Rendering item: Item or gpPlaceId is missing",
                item
              );
              return null;
            }
            const detail = placeDetailsMap[item.gpPlaceId];
            return (
              <ItineraryItem
                key={`${item.gpPlaceId}-${itemIndex}`}
                date={day.date}
                item={item}
                detail={detail}
                itemIndex={itemIndex}
                moveItem={moveItem}
                onDelete={() => handleDelete(item)} // Ensure correct item is passed to handleDelete
              />
            );
          })
        ) : (
          <div className="text-sm text-gray-500 text-center py-4">
            Drag and drop locations here or add them using the search below.
          </div>
        )}
      </div>
      <div className="mt-6 max-w-4xl">
        <LocSearchBar
          setSelectedLocation={handleAddLocationToDay}
          dayIndex={index}
        />
      </div>
      {index < currentTrip?.content.length - 1 && ( // Only add separator if it's not the last day
        <div className="my-6 border-t text-center border-gray-300 w-full mx-auto"></div>
      )}
    </>
  );
}
