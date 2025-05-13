import React, { useContext, useRef, useEffect } from "react";
import { AppContext } from "../../context/AppContext.jsx";
import TripDayPlan from "./TripDayPlan.jsx";

export default function ItinerarySection({ onRefsCreated }) {
  const { currentTrip } = useContext(AppContext);
  // Access day plans from currentTrip.content
  const dayPlans = currentTrip?.content;

  // Create a ref to hold refs for each day section
  const dayRefs = useRef({});

  // Update parent with refs whenever dayPlans changes
  useEffect(() => {
    if (dayPlans && onRefsCreated) {
      onRefsCreated(dayRefs.current);
    }
  }, [dayPlans, onRefsCreated]);

  console.log("ItinerarySection - currentTrip:", currentTrip);
  console.log("ItinerarySection - dayPlans (currentTrip.content):", dayPlans);

  // Check if dayPlans is an array and not empty
  if (!currentTrip) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
        }}
      >
        <span className="text-gray-500">
          Please select a date range to create the itinerary.
        </span>
      </div>
    );
  }

  if (!dayPlans || !Array.isArray(dayPlans)) {
    // This case might occur if currentTrip exists but content is missing/invalid
    // or if currentTrip is null and the above check didn't catch it (though it should)
    return (
      <div className="text-red-500">
        Error: Trip data (content) is invalid or not loaded.
      </div>
    );
  }

  if (dayPlans.length === 0) {
    return (
      <div className="text-gray-500">This trip has no planned days yet.</div>
    );
  }

  return (
    <div className="flex flex-col bg-white shadow-md rounded-lg py-4 px-20">
      {dayPlans.map((day, index) => (
        <div
          key={day.date || index}
          className="mb-4"
          // Assign a ref to this div using the day's date as the key
          ref={(el) => {
            if (el) dayRefs.current[day.date || `day-${index}`] = el;
            else delete dayRefs.current[day.date || `day-${index}`];
          }}
        >
          {" "}
          {/* Prefer day.date for key if available and unique */}
          <TripDayPlan day={day} index={index} />
        </div>
      ))}
    </div>
  );
}
