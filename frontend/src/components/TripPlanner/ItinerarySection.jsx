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

  if (!dayPlans || !Array.isArray(dayPlans)) {
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
    <div className="flex flex-col bg-[f3f2f3] dark:bg-gray-700 shadow-md  py-3 px-8 dark:text-white">
      {dayPlans.map((day, index) => (
        <div
          key={day.date || index}
          className="mb-4"
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
