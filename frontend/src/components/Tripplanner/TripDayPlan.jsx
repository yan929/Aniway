import React from "react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import usePlaceDetails from "../../hooks/usePlaceDetails.js";
import usePlacePhoto from "../../hooks/usePlacePhoto.js";
import SearchBar from "../Search/search.jsx"
import { AppContext } from "../../AppContextProvider.jsx";
import { useContext } from "react";
import {fetchPlaceByLatLng} from "../../hooks/fetchPlaceByLatLng.js";




export default function TripDayPlan({ day, index }) {

    const placeDetailsMap = usePlaceDetails(day.itinerary);

    const { tripData, updateTrip } = useContext(AppContext);

    const  handleAddLocationToDay = async (loc) => {
        console.log("✅ Selected Location from SearchBar:", loc); 
        
        const newPlaceData = await fetchPlaceByLatLng(loc.lat, loc.lng);

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
                {day.itinerary.map((item, itemIndex) => {
                    const detail = placeDetailsMap[item.gpPlaceId];
                    const photoURL = usePlacePhoto(detail?.photos[0]?.photo_reference);

                    return (
                        <div key={itemIndex} className="flex items-center gap-2">
                            <div className="flex items-start bg-gray-100 rounded-xl shadow-sm overflow-hidden w-full max-w-2xl">
                                <div className="flex-1 p-4 relative">
                                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-green-500 text-white text-sm rounded-full flex items-center justify-center z-10 shadow">
                                        {itemIndex + 1}
                                    </div>

                                    <div className="pl-4 pr-2">
                                        <h3 className="text-lg font-bold text-gray-700 text-left">
                                            {detail?.name || item.gpPlaceId}
                                        </h3>
                                        <p className="text-sm text-gray-700 text-left">
                                            {detail?.editorial_summary.overview || item.gpPlaceId}
                                        </p>
                                    </div>
                                </div>

                                <div className="w-32 h-24 flex-shrink-0">
                                    {{ photoURL } ? (
                                        <img
                                            src={photoURL}
                                            alt={detail?.name || item.gpPlaceId}
                                            className="object-cover w-full h-full rounded-r-xl"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-r-xl">
                                            <span className="text-gray-500">No Image</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-6 w-full max-w-2xl">
                <SearchBar onLocationSelected={handleAddLocationToDay}/>
            </div>
        </>
    );
}