import React from "react";
import { useContext } from "react";
import { AppContext } from "../../context/AppContext.jsx";
import TripDayPlan from "./TripDayPlan.jsx";

export default function ItinerarySection() {
  const { currentTrip } = useContext(AppContext);
  // Access day plans from currentTrip.content
  const dayPlans = currentTrip?.content;

  console.log("ItinerarySection - currentTrip:", currentTrip);
  console.log("ItinerarySection - dayPlans (currentTrip.content):", dayPlans);

  // Check if dayPlans is an array and not empty
  if (!currentTrip) {
    return <div className="text-gray-500">Loading trip data...</div>; // Or some other loading/empty state
  }

  if (!dayPlans || !Array.isArray(dayPlans)) {
    // This case might occur if currentTrip exists but content is missing/invalid
    // or if currentTrip is null and the above check didn't catch it (though it should)
    return <div className="text-red-500">Error: Trip data (content) is invalid or not loaded.</div>;
  }
  
  if (dayPlans.length === 0) {
    return <div className="text-gray-500">This trip has no planned days yet.</div>;
  }

  return (
    <div className="flex flex-col bg-white shadow-md rounded-lg p-4">
      {dayPlans.map((day, index) => (
        <div key={day.date || index} className="mb-4"> {/* Prefer day.date for key if available and unique */}
          <TripDayPlan day={day} index={index} />
        </div>
      ))}
    </div>
  );
}
