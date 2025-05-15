import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../../context/AppContext.jsx";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import dayjs from "dayjs";
import DatePicker from "../../components/DatePicker/DatePicker";

export default function TripHeader() {
  const { currentTrip, updateCurrentTripTitle, updateTrip } =
    useContext(AppContext);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [editableTitle, setEditableTitle] = useState(() =>
    currentTrip && currentTrip.title
      ? currentTrip.title.slice(0, 50)
      : "Trip Title"
  );
  // Store dates as Date objects or null
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    if (currentTrip && currentTrip.title) {
      setEditableTitle(currentTrip.title.slice(0, 50));
    } else {
      setEditableTitle("Trip Title"); // Default title if none exists
    }

    if (
      currentTrip &&
      currentTrip.content &&
      Array.isArray(currentTrip.content) &&
      currentTrip.content.length > 0
    ) {
      const firstDate = currentTrip.content[0].date;
      const lastDate = currentTrip.content[currentTrip.content.length - 1].date;
      setStartDate(firstDate ? dayjs(firstDate).toDate() : null);
      setEndDate(lastDate ? dayjs(lastDate).toDate() : null);
    } else {
      // If no content, or content is empty, reset dates or set to a default range
      // For now, resetting to null, DatePicker might handle default display
      setStartDate(null);
      setEndDate(null);
    }
  }, [currentTrip]);

  // This useEffect seems redundant if the one above handles title from currentTrip
  // useEffect(() => {
  //   setEditableTitle(currentTrip?.title || "My Trip");
  // }, [currentTrip]);

  const handleDatesChange = (selection) => {
    const { startDate: newStartJSDate, endDate: newEndJSDate } = selection;

    // Always update the local state to reflect DatePicker's current selection
    setStartDate(newStartJSDate || null);
    setEndDate(newEndJSDate || null);

    // Only proceed to update the trip if both dates are selected
    if (!newStartJSDate || !newEndJSDate) {
      // If only a start date is selected, or dates are cleared,
      // we've updated local state. DatePicker shows this.
      // We might not want to modify the actual trip days yet, or we might.
      // For now, let's assume we wait for a full range to update the trip days.
      // If you wanted to clear the trip when dates are cleared, you could call updateTrip([]) here.
      return;
    }

    // Both startDate and endDate are now available (newStartJSDate and newEndJSDate)
    // Proceed with formatting and updating the trip content
    const newStartString = dayjs(newStartJSDate).format("YYYY-MM-DD");
    const newEndString = dayjs(newEndJSDate).format("YYYY-MM-DD");

    const startDayjs = dayjs(newStartString);
    const endDayjs = dayjs(newEndString);

    if (startDayjs.isAfter(endDayjs, "day")) {
      setToastMessage("Start date cannot be after end date!");
      setIsToastVisible(true);

      // Revert to previous valid dates from currentTrip if possible, or do nothing
      if (
        currentTrip &&
        currentTrip.content &&
        currentTrip.content.length > 0
      ) {
        const firstDate = currentTrip.content[0].date;
        const lastDate =
          currentTrip.content[currentTrip.content.length - 1].date;
        setStartDate(firstDate ? dayjs(firstDate).toDate() : null);
        setEndDate(lastDate ? dayjs(lastDate).toDate() : null);
      } else {
        setStartDate(null);
        setEndDate(null);
      }
      return;
    }

    const newRange = [];
    let currentDayIter = startDayjs;
    const tripContent =
      currentTrip && currentTrip.content && Array.isArray(currentTrip.content)
        ? currentTrip.content
        : [];

    while (currentDayIter.isSameOrBefore(endDayjs, "day")) {
      const currentDateStr = currentDayIter.format("YYYY-MM-DD");
      const existingDay = tripContent.find(
        (day) => day.date === currentDateStr
      );
      newRange.push(existingDay || { date: currentDateStr, itinerary: [] });
      currentDayIter = currentDayIter.add(1, "day");
    }
    updateTrip(newRange);
  };

  const handleEditTitle = () => {
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (!currentTrip) {
      setToastMessage(
        "Error: Could not save trip title. Trip data is missing."
      );
      setIsToastVisible(true);
      return;
    }
    updateCurrentTripTitle(editableTitle.slice(0, 50));
    setIsEditingTitle(false);
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    if (currentTrip && currentTrip.title) {
      setEditableTitle(currentTrip.title.slice(0, 50));
    } else {
      setEditableTitle("Trip Title");
    }
  };

  return (
    <div
      className=" px-4 py-3 shadow-md w-full"
      style={{
        background: `linear-gradient(rgba(107, 121, 229, 0.80), rgba(107, 121, 229, 0.85)), url('/tripplanner-banner.jpg') center center / cover no-repeat`,
      }}
    >
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
              <h1 className="text-2xl  text-white font-bold truncate ">
                {editableTitle}
              </h1>
              <button
                onClick={handleEditTitle}
                className="p-1 text-white hover:text-gray-700 ml-2"
              >
                <FaEdit size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row: Date Picker (Centered) */}
      <div className="flex items-center justify-center text-gray-600 text-sm gap-2 mt-2 font-semibold">
        <div className="relative">
          <DatePicker
            selectedDates={{ startDate, endDate }}
            onDateSelect={handleDatesChange}
            mainDisplayTextColor="text-white"
          />
        </div>
      </div>
    </div>
  );
}
