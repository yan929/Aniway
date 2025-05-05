import React from "react";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTrash,
  FaUserCircle,
} from "react-icons/fa";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isToday from "dayjs/plugin/isToday";
import isBetween from "dayjs/plugin/isBetween";

// Extend Day.js with the plugins
dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isBetween);

const formatDateRangeWithDayjs = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return "Date not set";

  try {
    const start = dayjs(startDateStr);
    const end = dayjs(endDateStr);

    if (!start.isValid() || !end.isValid()) {
      return "Invalid Date";
    }

    const startFormat = start.format("D MMM");
    const endFormat = end.format("D MMM YYYY");

    return `${startFormat} → ${endFormat}`;
  } catch (e) {
    console.error("Error formatting date with Day.js:", e);
    return "Invalid Date";
  }
};

const getTripStatusWithDayjs = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return null;

  try {
    // Use startOf('day') to compare dates without time component influence
    const now = dayjs().startOf("day");
    const start = dayjs(startDateStr).startOf("day");
    const end = dayjs(endDateStr).startOf("day"); // Also normalize end date

    // Handle invalid dates
    if (!start.isValid() || !end.isValid()) {
      return null; // Or "Invalid Date Status"
    }

    if (start.isToday()) {
      return "Today";
    } else if (start.isAfter(now)) {
      // Check if it's exactly tomorrow
      if (start.diff(now, "day") === 1) {
        return "Tomorrow";
      }
      // Otherwise, use relative time for future dates
      // fromNow(true) removes the "in " prefix, fromNow() includes it.
      return start.fromNow(); // e.g., "in 5 days"
    } else {
      // Start date is in the past
      // Check if the end date is also in the past
      if (end.isBefore(now)) {
        return "Completed";
      } else {
        // End date is today or in the future -> Ongoing
        // Can also use isBetween: if (now.isBetween(start, end, 'day', '[]')) return 'Ongoing';
        return "Ongoing";
      }
    }
  } catch (e) {
    console.error("Error calculating trip status with Day.js:", e);
    return null;
  }
};

const TripCard = ({ trip, onDelete }) => {
  const { title, startDate, endDate, destination, plan } = trip;

  // --- Get Image ---
  const coverImage =
    plan?.[0]?.itinerary?.[0]?.image || "https://picsum.photos/300/200";

  // --- Calculate Trip Status using Day.js ---
  const tripStatusText = getTripStatusWithDayjs(startDate, endDate);

  // --- Format Date Range using Day.js ---
  const formattedDate = formatDateRangeWithDayjs(startDate, endDate);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(trip);
    } else {
      console.log("Delete clicked for:", title);
    }
  };

  return (
    <div className="flex bg-white rounded-lg shadow-md overflow-hidden max-w-2xl hover:shadow-lg transition-shadow duration-200 cursor-pointer">
      {/* Image Section */}
      <div className="w-48 flex-shrink-0 relative">
        <img
          src={coverImage}
          alt={`Image for ${title}`}
          className="w-full h-full object-cover"
        />
        {/* Display the calculated status */}
        {tripStatusText && (
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs font-semibold px-2 py-1 rounded">
            {tripStatusText}
          </div>
        )}
      </div>

      <div className="flex-1 p-4 flex flex-col justify-between relative">
        {/* Top: Title and Delete Icon */}
        <div>
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-semibold text-gray-800 mr-2">
              {title}
            </h2>
            <button
              onClick={handleDeleteClick}
              className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1 -mt-1 -mr-1"
              aria-label={`Delete ${title}`}
            >
              <FaTrash size={18} />
            </button>
          </div>

          {/* Middle: Date and Destination */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm text-gray-600">
            <span className="flex items-center">
              <FaCalendarAlt className="mr-1.5 text-gray-500" />
              {formattedDate}
            </span>
            <span className="flex items-center">
              <FaMapMarkerAlt className="mr-1.5 text-gray-500" />
              {destination}
            </span>
          </div>
        </div>

        {/* Bottom Right: User Icon */}
        <div className="absolute bottom-3 right-3 text-gray-400">
          <FaUserCircle size={32} />
          {/* <img src={userImageUrl} alt="User" className="w-8 h-8 rounded-full object-cover" /> */}
        </div>
      </div>
    </div>
  );
};

export default TripCard;
