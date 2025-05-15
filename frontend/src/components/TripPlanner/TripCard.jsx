import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaTrash } from "react-icons/fa";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isToday from "dayjs/plugin/isToday";
import isBetween from "dayjs/plugin/isBetween";
import { fetchPlaceDetails } from "../../hooks/fetchPlaceDetail.js";
import { fetchPlacePhoto } from "../../hooks/fetchPlacePhoto.js";

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

const TripCard = ({ user, trip, onDelete, onClick }) => {
  const { title, startDate, endDate, destination } = trip;
  const [coverImage, setCoverImage] = useState("https://picsum.photos/300/200");

  useEffect(() => {
    let isMounted = true;

    const findFirstGpPlaceId = () => {
      if (trip?.content && Array.isArray(trip.content)) {
        for (const day of trip.content) {
          if (day?.itinerary && Array.isArray(day.itinerary)) {
            for (const item of day.itinerary) {
              if (item?.gpPlaceId && typeof item.gpPlaceId === 'string' && item.gpPlaceId.trim() !== '') {
                return item.gpPlaceId;
              }
            }
          }
        }
      }
      return null;
    };

    const fetchAndSetCoverImage = async () => {
      const firstGpPlaceId = findFirstGpPlaceId();
      let newCoverImage = "https://picsum.photos/300/200";

      if (firstGpPlaceId) {
        try {
          const placeDetails = await fetchPlaceDetails(firstGpPlaceId);

          // Assuming placeDetails.photos is an array and we take the first photo's reference
          const photoReference = placeDetails?.photos?.[0]?.photo_reference;

          if (photoReference) {
            const photoDataUrl = await fetchPlacePhoto(photoReference);
            if (photoDataUrl) {
              newCoverImage = photoDataUrl;
            } else if (trip?.image && typeof trip.image === 'string' && trip.image.trim() !== '') {
              // Fallback if fetchPlacePhoto fails but trip.image exists
              newCoverImage = trip.image;
            }
            // If photoDataUrl is null and trip.image is also not there, it stays default placeholder
          } else if (trip?.image && typeof trip.image === 'string' && trip.image.trim() !== '') {
            // No photo reference, fallback to trip's main image
            newCoverImage = trip.image;
          }
          // If no photo reference and no trip.image, it remains the default placeholder
        } catch (error) {
          console.error(`Failed to fetch place details or photo for ${firstGpPlaceId} in TripCard:`, error);
          // On error fetching details/photo, fallback to trip.image or default
          if (trip?.image && typeof trip.image === 'string' && trip.image.trim() !== '') {
            newCoverImage = trip.image;
          }
        }
      } else if (trip?.image && typeof trip.image === 'string' && trip.image.trim() !== '') {
        // No gpPlaceId found, use trip.image
        newCoverImage = trip.image;
      }
      // Else, newCoverImage remains the default placeholder initially set

      if (isMounted) {
        setCoverImage(newCoverImage);
      }
    };

    fetchAndSetCoverImage();

    return () => {
      isMounted = false;
    };
  }, [trip]);

  // --- Calculate Trip Status using Day.js ---
  const tripStatusText = getTripStatusWithDayjs(startDate, endDate);

  // --- Format Date Range using Day.js ---
  const formattedDate = formatDateRangeWithDayjs(startDate, endDate);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(trip);
    } else {
      // console.log("Delete clicked for:", title);
    }
  };

  return (
    <div
      className="flex bg-white rounded-lg shadow-md overflow-hidden w-full hover:shadow-lg transition-shadow duration-200 cursor-pointer dark:bg-gray-800"
      onClick={onClick}
    >
      {/* Image Section */}
      <div className="w-48 max-h-[150px] flex-shrink-0 relative">
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
            <h2 className="text-lg font-semibold text-gray-800 mr-2 dark:text-gray-100">
              {title}
            </h2>
            <button
              onClick={handleDeleteClick}
              className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1 -mt-1 -mr-1 dark:text-gray-400"
              aria-label={`Delete ${title}`}
            >
              <FaTrash size={18} />
            </button>
          </div>

          {/* Middle: Date and Destination */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center">
              <FaCalendarAlt className="mr-1.5 text-gray-500 dark:text-gray-400" />
              {formattedDate}
            </span>
            {destination && (
              <span className="flex items-center">
                <FaMapMarkerAlt className="mr-1.5 text-gray-500 dark:text-gray-400" />
                {destination}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Right: User Icon */}
        <div className="absolute bottom-3 right-3 text-gray-400 dark:text-gray-400">
          <img
            src={user.avatar}
            alt="User"
            className="w-8 h-8 rounded-full object-cover dark:text-gray-400"
          />
        </div>
      </div>
    </div>
  );
};

export default TripCard;
