import React from 'react';
import { useContext } from 'react';
import { AppContext } from '../../AppContextProvider.jsx';
import TripDayPlan from '../Tripplanner/TripDayPlan.jsx';

export default function ItinerarySection() {

    const { tripData } = useContext(AppContext);
    console.log("Tripdata", tripData);

    if (!Array.isArray(tripData)) {
        return <div className="text-red-500">Error: Trip data is invalid.</div>;
      }

    return (
        <div className="flex flex-col bg-white shadow-md rounded-lg p-4">
    
            {tripData.map((day, index) => (
                <div key={index} className="mb-4">
               
                <TripDayPlan day={day} index={index} />

                </div>
            ))}
        </div>
    );
}