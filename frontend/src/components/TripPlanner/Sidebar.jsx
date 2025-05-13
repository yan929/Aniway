import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext.jsx";
import { IoSparklesOutline, IoCalendarOutline, IoCaretDownOutline } from "react-icons/io5";
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
    <aside className="bg-slate-700 text-white w-48 p-4 flex flex-col gap-1 flex-shrink-0 h-full">
      <nav className="flex flex-col gap-2 shrink-0">
        <button
          onClick={onToggleChat}
          className="flex items-center justify-center gap-2  text-left py-1 px-3 h-12 rounded bg-orange-500 hover:bg-orange-400 text-black font-semibold transition-colors"
          style={{ fontSize: "14px" }}
        >
          <IoSparklesOutline size={18} />
          Smart Assistant
        </button>
        <div className="flex items-center justify-left gap-2 text-xl py-2 px-3 rounded bg-white text-black font-semibold shadow-inner">
          <IoCaretDownOutline size={18} /> Overview
        </div>

        <div className="flex items-center justify-left gap-2 text-xl py-2 px-3 rounded font-semibold">
          <IoCalendarOutline size={18} />
          <span>Itinerary</span>
        </div>
      </nav>
      <div className="flex-grow flex flex-col gap-1 text-gray-300 overflow-y-auto w-full min-h-0">
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
        className="flex mt-auto items-center justify-center gap-2 text-left py-2 px-3 rounded bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors shrink-0"
      >
        <FaSave size={16} />
        Save Trip
      </button>
    </aside>
  );
}
