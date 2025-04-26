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
    const { tripData, updateItinerary,deleteTripItem } = useContext(AppContext);
    const [items, setItems] = React.useState(day.itinerary);

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
        //not finished yet
        const testUpdateItem = {
            date: "2025-10-01",
            gpPlaceId: newPlaceData.place_id,
            order: 3,
        };
        const newTripData = updateItinerary(tripData, testUpdateItem);
        console.log("✅ newPlace:", newPlaceData);
    };

    const handdleDelete = (item) => {

        console.log("Delete item:", item);
        deleteTripItem(day,item);
    }

    return (
        <>
            <div className="flex items-center gap-6 text-[1.375rem] font-semibold text-gray-800">
                <span>Day {index + 1}</span>
                <span>{dayjs(day.date).format("dddd, MMMM D")}</span>
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
