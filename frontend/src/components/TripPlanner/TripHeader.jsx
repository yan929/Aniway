import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../../context/AppContext.jsx";
import { FaCalendarAlt, FaMapMarkerAlt, FaEdit } from "react-icons/fa";
import dayjs from "dayjs";

export default function TripHeader() {
  const { tripData, updateTrip, tripTitle, tripLocation } = useContext(AppContext);

  // Initialize state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(tripTitle || "My Trip");

  // Monitor tripData changes and update date range
  useEffect(() => {
    if (Array.isArray(tripData) && tripData.length > 0) {
      setStartDate(tripData[0].date);
      setEndDate(tripData[tripData.length - 1].date);
    }
  }, [tripData]); // Depend on tripData changes

  // Update local title when tripTitle changes
  useEffect(() => {
    setEditedTitle(tripTitle || "My Trip");
  }, [tripTitle]);

  // Handle date range boundary changes
  const handleBoundaryDateChange = (type, value) => {
    if (!Array.isArray(tripData) || tripData.length === 0) return;

    // Construct new range data, instead of modifying old data
    const newStart = type === "start" ? value : tripData[0].date;
    const newEnd = type === "end" ? value : tripData[tripData.length - 1].date;

    // Generate new range data
    const start = dayjs(newStart);
    const end = dayjs(newEnd);
    const newRange = [];
    let current = start.clone();

    // Validate date range
    if (dayjs(newStart).isAfter(newEnd, "day")) {
      alert("Start date cannot be after end date!");
      return;
    }

    // Fill in the new range
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

    // Update the trip data
    updateTrip(newRange);
  };

  // Toggle title editing mode
  const handleEditTitle = () => {
    setIsEditingTitle(true);
  };

  // Save edited title
  const handleSaveTitle = () => {
    // Here you would add the logic to save the title to context
    // For example: setTripTitle(editedTitle);
    setIsEditingTitle(false);
  };

  return (
    <div className="bg-green-700 px-6 py-4 shadow-md w-full">
      <div className="bg-white rounded-lg px-6 py-4 max-w-3xl mx-auto">
        {/* Trip Title with Edit Functionality */}
        <div className="flex items-center justify-between mb-2">
          {isEditingTitle ? (
            <div className="flex items-center">
              <input
                type="text"
                className="border rounded px-2 py-1 mr-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <h1 className="text-xl font-bold mr-2">{tripTitle || "My Trip"}</h1>
              <button
                onClick={handleEditTitle}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaEdit size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Trip Location Display */}
        {tripLocation && (
          <div className="flex items-center mb-3 text-gray-600">
            <FaMapMarkerAlt className="mr-2" />
            <span>
              {tripLocation.name || tripLocation.description || "Selected Destination"}
            </span>
          </div>
        )}

        {/* Date Range Selection */}
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