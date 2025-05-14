import React from "react";
import { FaCheck } from "react-icons/fa";

function HorizontalLocationCard({
  sectionTitle,
  locList,
  onLocationClick,
  onAddToItinerary,
  onRemoveFromItinerary,
  addedLocations = new Set(),
}) {
  // Extract all anime names (English and Japanese) from arrays
  const getAnimeNames = (location) => {
    if (location?.anime_en_names?.length > 0) {
      return location.anime_en_names.map((name, index) => ({
        en_name: name,
        jp_name: location.anime_names?.[index] || null,
      }));
    }
    return [];
  };

  // Handle toggle (add/remove)
  const handleToggle = (e, data) => {
    e.stopPropagation(); // Prevent triggering the parent's onClick

    if (addedLocations.has(data.id)) {
      // If already added, remove it
      onRemoveFromItinerary && onRemoveFromItinerary(data);
    } else {
      // If not added, add it
      onAddToItinerary && onAddToItinerary(data);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-extrabold tracking-wide flex items-center mb-6 dark:text-white">
        {sectionTitle}
      </h2>
      <div className="flex flex-col gap-4 pb-8">
        {locList.map((data) => (
          <div
            key={data.id}
            className="flex bg-white rounded-lg overflow-hidden shadow-md transition-transform duration-300 ease-in-out transform hover:scale-102 relative group dark:bg-gray-800"
          >
            {/* Left side - Image */}
            <div
              className="w-1/4 h-48 cursor-pointer"
              onClick={() => onLocationClick && onLocationClick(data)}
            >
              <img
                src={
                  (data.images && data.images[0]) ||
                  data.image ||
                  "/default-image.jpg"
                }
                alt={data.names}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/default-image.jpg";
                }}
              />
            </div>

            {/* Right side - Information */}
            <div
              className="w-3/4 p-4 flex flex-col justify-between cursor-pointer relative dark:bg-gray-800"
              onClick={() => onLocationClick && onLocationClick(data)}
            >
              <div>
                <h3 className="text-xl font-bold mb-2 text-left dark:text-white">
                  {data.name}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2 text-left dark:text-gray-300">
                  {data.addresses?.[0] || "No address available"}
                </p>
              </div>

              <div>
                <h4 className="text-md font-semibold text-gray-700 mb-2 text-left dark:text-white">
                  Related Anime:
                </h4>
                {(data.anime_en_names && data.anime_en_names.length > 0) ||
                (data.anime_names && data.anime_names.length > 0) ? (
                  <div className="flex flex-wrap gap-2">
                    {getAnimeNames(data).map((anime, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-2 hover:shadow-sm transition-shadow bg-white dark:bg-gray-800"
                      >
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {anime.en_name}
                        </p>
                        {anime.jp_name && (
                          <p className="text-xs text-gray-600 mt-1">
                            {anime.jp_name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No related anime information available
                  </p>
                )}
              </div>

              {/* Checkbox in bottom right */}
              {onAddToItinerary && (
                <div
                  className="absolute bottom-4 right-4 flex items-center"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the parent's onClick
                    handleToggle(e, data);
                  }}
                >
                  <div
                    className={`w-10 h-10 border-2 rounded flex items-center justify-center cursor-pointer 
                      ${
                        addedLocations.has(data.id)
                          ? "border-green-600 bg-green-500 dark:bg-green-400"
                          : "border-gray-400 bg-gray-100 dark:bg-gray-700 hover:border-green-400 dark:hover:border-green-300"
                      }
                      transition-colors duration-200`}
                  >
                    {addedLocations.has(data.id) && (
                      <FaCheck
                        size={16}
                        className="text-white dark:text-gray-900"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default HorizontalLocationCard;
