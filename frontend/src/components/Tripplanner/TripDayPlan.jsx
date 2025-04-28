import React from "react";
import dayjs from "dayjs";
import { useState } from "react";
import usePlaceDetails from "../../hooks/usePlaceDetails.js";
import SearchBar from "../Search/search.jsx";
import { AppContext } from "../../AppContextProvider.jsx";
import { useContext } from "react";
import { fetchPlaceByLatLng } from "../../hooks/fetchPlaceByLatLng.js";
import ItineraryItem from "./ItineraryItem.jsx";
import SmartAdviceWindow from "./SmartAdviceWindow.jsx";

export default function TripDayPlan({ day, index }) {
    const placeDetailsMap = usePlaceDetails(day.itinerary);
    const { tripData, updateItinerary, deleteTripItem } = useContext(AppContext);
    const [items, setItems] = useState(day.itinerary);
    const [isOpen, setIsOpen] = useState(false);



    React.useEffect(() => {
        setItems(day.itinerary);
    }, [day.itinerary]);

    const moveItem = (from, to) => {
        if (from === to) return;
        const updated = [...items];
        const [moved] = updated.splice(from, 1);
        updated.splice(to, 0, moved);
        setItems(updated);
        // Optionally update global state here
    };

    const handleAddLocationToDay = async (loc) => {

        const newPlaceData = await fetchPlaceByLatLng(loc.label, loc.lat, loc.lng);
        console.log("day", day);
        //not finished yet
        const UpdateItem = {
            date: day.date,
            gpPlaceId: newPlaceData.place_id,
            order: day.itinerary.length,
        };
        updateItinerary(tripData, UpdateItem);;
    };

    const handdleDelete = (item) => {
        deleteTripItem(day, item);
    }


    return (
        <>
            <div className="flex items-center gap-6 text-[1.375rem] font-semibold text-gray-800">
                <span>Day {index + 1}</span>
                <span>{dayjs(day.date).format("dddd, MMMM D")}</span>
                <button className="mt-auto bg-orange-400 text-black rounded-full py-1 px-4 text-[1rem] hover:bg-orange-300"
                    onClick={() => setIsOpen(true)}
                >
                    Smart advice </button>
                <SmartAdviceWindow
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    day={day}
                />
            </div>
            <div className="flex flex-col gap-2 mt-4 text-[1.375rem] font-semibold text-gray-800">
                {items.map((item, itemIndex) => {
                    const detail = placeDetailsMap[item.gpPlaceId];
                    return (
                        <ItineraryItem
                            key={itemIndex}
                            item={item}
                            detail={detail}
                            itemIndex={itemIndex}
                            moveItem={moveItem}
                            onDelete={handdleDelete}
                        />
                    )
                })}
            </div>
            <div className="mt-6 w-full max-w-2xl">
                <SearchBar onLocationSelected={handleAddLocationToDay} />
            </div>
        </>
    );
}
