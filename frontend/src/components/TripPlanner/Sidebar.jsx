import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext.jsx";
import { IoSparkles, IoCalendarOutline, IoCaretDownOutline } from "react-icons/io5";

import { FaSave } from "react-icons/fa";

export default function Sidebar({ onToggleChat, onScrollToDay }) {
  const { currentTrip, saveCurrentTripToDb, selectDay } =
    useContext(AppContext);

  const handleSave = React.useCallback(() => {
    if (!currentTrip) {
      alert("No trip data to save.");
      return;
    }
    saveCurrentTripToDb();
  }, [currentTrip, saveCurrentTripToDb]);

  const daysData = Array.isArray(currentTrip?.content)
    ? currentTrip.content.map((day) => {
      const dateObj = new Date(day.date);
      const dayLabel = dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      });
      return { date: day.date, label: dayLabel };
    })
    : [];

  return (
    <aside className="relative z-20 bg-[#e6e5e6] text-white w-48 p-4 flex flex-col gap-1 flex-shrink-0 h-full">
      <nav className="flex flex-col gap-2 shrink-0">
        <button
          onClick={onToggleChat}
          className="flex items-center justify-center gap-2  text-left py-1 px-3 h-12 rounded bg-[#17c686] hover:bg-green-600 text-white leading-4.5 font-semibold transition-colors"
          style={{ fontSize: "18px" }}
        >
          <IoSparkles size={20} color="white" />
          Smart Assistant
        </button>
        <div className="flex items-center justify-left gap-2 py-2 px-3 rounded bg-[#626fe4] text-white font-semibold shadow-inner"
          style={{ fontSize: "17px" }}
        >
          <IoCaretDownOutline size={18} /> Overview
        </div>

        <div className="flex items-center justify-left gap-2 text-xl py-2 px-3 rounded font-semibold text-black"
          style={{ fontSize: "17px" }}>
          <IoCalendarOutline size={18} />
          <span>Itinerary</span>
        </div>
      </nav>
      <div className="flex-grow flex flex-col gap-1 text-gray-800 overflow-y-auto w-full min-h-0">
        {daysData.length > 0 ? (
          daysData.map((dayData, index) => (
            <div
              key={dayData.date || index}
              className="flex items-center text-left hover:text-white cursor-pointer py-2.5 px-4 rounded hover:bg-gray-700 w-full font-semibold"
              onClick={() => {
                selectDay(dayData.date);
                onScrollToDay(dayData.date);
              }}
            >
              {dayData.label}
            </div>
          ))
        ) : (
          <p className="text-gray-400 italic">No dates in trip.</p>
        )}
      </div>
      <button
        onClick={handleSave}
        className="flex mt-auto items-center justify-center gap-2 text-left py-2 px-3 rounded bg-[#242423] hover:bg-green-600 text-white font-semibold transition-colors shrink-0"
      >
        <FaSave size={16} />
        Save Trip
      </button>
    </aside>
  );
}
