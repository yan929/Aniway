import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { useContext } from "react";
import { AppContext } from "../../context/AppContext.jsx";
import { FaCalendarAlt } from "react-icons/fa";
import dayjs from "dayjs";

// export default function TripHeader() {
//     const { tripData, updateTrip } = useContext(AppContext);

//     const [startDate, setStartDate] = useState(
//       Array.isArray(tripData) && tripData.length > 0 ? tripData[0].date : ''
//     );
//     const [endDate, setEndDate] = useState(
//       Array.isArray(tripData) && tripData.length > 0 ? tripData[tripData.length - 1].date : ''
//     );

//     const handleBoundaryDateChange = (type, value) => {
//       if (!Array.isArray(tripData) || tripData.length === 0) return;

//       const updateTripData = [...tripData];
//       const index = type === 'start' ? 0 : updateTripData.length - 1;

//       updateTripData[index] = {
//         ...updateTripData[index],
//         date: value
//       };

//       updateTrip(updateTripData);

//       if (type === 'start') setStartDate(value);
//       else setEndDate(value);
//     };

export default function TripHeader() {
  const { tripData, updateTrip } = useContext(AppContext);

  //init state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // monitor tripData changes and update date range
  useEffect(() => {
    if (Array.isArray(tripData) && tripData.length > 0) {
      setStartDate(tripData[0].date);
      setEndDate(tripData[tripData.length - 1].date);
    }
  }, [tripData]); // rely on tripData changes

  const handleBoundaryDateChange = (type, value) => {
    if (!Array.isArray(tripData) || tripData.length === 0) return;

    //construct new range data,instead of modifying old data
    const newStart = type === "start" ? value : tripData[0].date;
    const newEnd = type === "end" ? value : tripData[tripData.length - 1].date;

    //generate new range data
    const start = dayjs(newStart);
    const end = dayjs(newEnd);
    const newRange = [];
    let current = start.clone();

    //temporary use for debugging, modify the alert message later
    if (dayjs(newStart).isAfter(newEnd, "day")) {
      alert("🚫 Start date could be after end date!");
      return;
    }

    // Fill in the new range
    // Check if the current date is within the range
    //If the current date is before the start date, the while loop will not run
    while (current.isSameOrBefore(end, "day")) {
      // Format the current date to YYYY-MM-DD
      const currentDate = current.format("YYYY-MM-DD");
      // Check if the current date exists in the trip data
      const existingDay = tripData.find((day) => day.date === currentDate);
      // If it exists, use the existing day data; otherwise, create a new day object
      newRange.push(existingDay || { date: currentDate, itinerary: [] });
      // Increment the current date by one day
      current = current.add(1, "day");
    }

    // update the trip data
    updateTrip(newRange);
  };

  return (
    <div className="bg-green-700 px-6 py-4 shadow-md w-full">
      <div className="bg-white rounded-lg px-6 py-4 max-w-3xl mx-auto">
        <h1 className="text-xl font-bold mb-2">Trip Title</h1>
        <div className="flex items-center text-gray-600 text-sm gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <FaCalendarAlt className="" />
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={startDate}
              onChange={(e) =>
                handleBoundaryDateChange("start", e.target.value)
              }
            />
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span>-</span>
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={endDate}
              onChange={(e) => handleBoundaryDateChange("end", e.target.value)}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
