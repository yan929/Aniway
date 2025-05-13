import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../context/AppContext";

function SearchLocItem({
  icon,
  title,
  resultList,
  selectedIndex,
  onSelectLocation,
  searchTerm,
  showBackButton = true, // Prop to control whether to show Back button on search results page
  dayIndex = null, // Optional day index to pass to search page
}) {
  const { tripData } = useContext(AppContext);

  // Default to current day index if not provided
  const currentDayIndex =
    dayIndex !== null ? dayIndex : tripData && tripData.length > 0 ? 0 : null;

  // Handle clicking a location item
  const handleResultClick = (result) => {
    onSelectLocation({ lat: result.lat, lng: result.lng, label: result.name });
  };

  return (
    <div className="w-full">
      <p className="font-bold text-base px-4 py-2 pb-1 text-gray-800 border-b border-gray-200">
        {title}
      </p>
      {resultList.length > 0 ? (
        <div className="w-full">
          {/* List of search results */}
          {resultList.slice(0, 5).map((result, id) => (
            <div
              key={`loc-${id}`}
              className={`flex items-start px-4 py-2 w-full border-b border-gray-100 cursor-pointer transition-colors duration-200 hover:bg-gray-50 ${selectedIndex === id ? "bg-gray-50" : ""
                }`}
              onClick={() => handleResultClick(result)}
            >
              <div className="itemIcon w-6 h-6 flex-shrink-0 flex items-center justify-center mr-2">
                {icon && React.createElement(icon)}
              </div>

              <div className="flex-1 min-w-0 relative min-h-[72px]">
                <div className="flex flex-col overflow-hidden pr-20">
                  <p className="font-semibold m-0 text-sm text-left">{result.name || result.locationName}</p>
                  <p className="truncate whitespace-nowrap overflow-hidden text-ellipsis text-sm m-0 text-gray-600 text-left">
                    {result.addresses[0]}
                  </p>
                  <p className="text-sm m-0 text-gray-600 text-left">{result.animeName}</p>
                </div>

                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 rounded-md overflow-hidden">
                  <img
                    src={result.images?.[0] ||
                      (result.image && result.image ? result.image : "/frontend/default-image.jpg")}
                    alt={result.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          ))}
          <Link
            to={`/locations/search?q=${encodeURIComponent(
              searchTerm || ""
            )}&backButton=${showBackButton}${currentDayIndex !== null ? `&day=${currentDayIndex}` : ""
              }`}
            className="block py-2.5 px-4 mt-1.5 text-center text-blue-500 text-sm cursor-pointer transition-colors duration-200 no-underline hover:bg-blue-50 hover:underline"
          >
            Find more locations
          </Link>
        </div>
      ) : (
        <p className="noResult">No result found</p>
      )}
    </div>
  );
}

export default SearchLocItem;
