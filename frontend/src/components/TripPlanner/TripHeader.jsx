import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../../context/AppContext.jsx";
import { FaCalendarAlt, FaMapMarkerAlt, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import dayjs from "dayjs";

export default function TripHeader() {
  const {
    currentTrip,
    updateCurrentTripDetails,
    updateTrip,
  } = useContext(AppContext);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState(() =>
    currentTrip && currentTrip.title ? currentTrip.title : "Trip Title"
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (currentTrip && currentTrip.title) {
      setEditableTitle(currentTrip.title);
    } else {
      setEditableTitle("Trip Title");
    }

    if (
      currentTrip &&
      currentTrip.content &&
      Array.isArray(currentTrip.content) &&
      currentTrip.content.length > 0
    ) {
      setStartDate(currentTrip.content[0].date);
      setEndDate(currentTrip.content[currentTrip.content.length - 1].date);
    } else {
      setStartDate("");
      setEndDate("");
    }
  }, [currentTrip]);

  // Update local title when tripTitle changes
  useEffect(() => {
    setEditedTitle(tripTitle || "My Trip");
  }, [tripTitle]);

  // Handle date range boundary changes
  const handleBoundaryDateChange = (type, value) => {
    if (
      !currentTrip ||
      !currentTrip.content ||
      !Array.isArray(currentTrip.content) ||
      currentTrip.content.length === 0
    )
      return;

    const tripContent = currentTrip.content;
    const newStart = type === "start" ? value : tripContent[0].date;
    const newEnd =
      type === "end" ? value : tripContent[tripContent.length - 1].date;

    const start = dayjs(newStart);
    const end = dayjs(newEnd);
    const newRange = [];
    let current = start;

    if (dayjs(newStart).isAfter(newEnd, "day")) {
      alert(" Start date cannot be after end date!");
      return;
    }

    while (current.isSameOrBefore(end, "day")) {
      const currentDate = current.format("YYYY-MM-DD");
      const existingDay = tripContent.find((day) => day.date === currentDate);
      newRange.push(existingDay || { date: currentDate, itinerary: [] });
      current = current.add(1, "day");
    }

    updateTrip(newRange);
  };

  const handleEditTitle = () => {
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (!currentTrip) {
      console.error("Cannot save title: currentTrip is not available.");
      alert("Error: Could not save trip title. Trip data is missing.");
      return;
    }
    updateCurrentTripDetails({ title: editableTitle });
    setIsEditingTitle(false);
    console.log("TripHeader: Title update sent to AppContext for local state.");
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    if (currentTrip && currentTrip.title) {
      setEditableTitle(currentTrip.title);
    } else {
      setEditableTitle("Trip Title");
    }
  };

  return (
    <div className="bg-green-700 px-6 py-4 shadow-md w-full">
      <div className="bg-white rounded-lg px-6 py-4 max-w-3xl mx-auto">
        {/* Top Row: Title and Save Button */}
        <div className="flex items-center w-full mb-2">
          {/* Trip Title Section (Left) */}
          <div className="flex-grow flex items-center justify-center">
            {isEditingTitle ? (
              <>
                <input
                  type="text"
                  value={editableTitle}
                  onChange={(e) => setEditableTitle(e.target.value)}
                  className="text-xl font-bold border-b-2 border-green-500 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1 text-green-600 hover:text-green-800 ml-2"
                >
                  <FaSave size={18} />
                </button>
                <button
                  onClick={handleCancelEditTitle}
                  className="p-1 text-red-500 hover:text-red-700 ml-1"
                >
                  <FaTimes size={18} />
                </button>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold truncate">{editableTitle}</h1>
                <button
                  onClick={handleEditTitle}
                  className="p-1 text-gray-500 hover:text-gray-700 ml-2"
                >
                  <FaEdit size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bottom Row: Date Selector (Centered) */}
        <div className="flex items-center justify-center text-gray-600 text-sm gap-2 mt-2">
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