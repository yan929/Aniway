import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext.jsx";
import { IoSparklesOutline } from "react-icons/io5";
import { FaSave } from "react-icons/fa";

export default function Sidebar({ onToggleChat, onScrollToDay }) {
  const { currentTrip, saveCurrentTripToDb, selectDay } =
    useContext(AppContext);

  const handleSave = () => {
    if (!currentTrip) {
      alert("No trip data to save.");
      return;
    }
    saveCurrentTripToDb();
  };

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
    <aside className="bg-gray-800 text-white w-48 p-4 flex flex-col gap-6 h-screen shrink-0">
      <nav className="flex flex-col gap-2">
        <button
          onClick={onToggleChat}
          className="flex items-center justify-center gap-2 text-left py-1 px-3 rounded bg-orange-500 hover:bg-orange-400 text-black font-semibold transition-colors"
        >
          <IoSparklesOutline size={18} />
          Smart Assistant
        </button>
        <button className="text-left py-2 px-3 rounded bg-white text-black font-semibold shadow-inner">
          ➤ Overview
        </button>

        <button className="text-left py-2 px-3 rounded font-semibold">
          🗺️ Itinerary
        </button>
      </nav>
      <div className="flex flex-col gap-1 text-center text-gray-300 overflow-y-auto">
        {daysData.length > 0 ? (
          daysData.map((dayData, index) => (
            <div
              key={dayData.date || index}
              className="hover:text-white cursor-pointer p-1 rounded hover:bg-gray-700"
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
        className="flex mt-auto items-center justify-center gap-2 text-left py-2 px-3 rounded bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors"
      >
        <FaSave size={16} />
        Save Trip
      </button>
    </aside>
  );
}
