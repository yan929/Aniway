import React from "react";

function HorizontalLocationCard({ sectionTitle, locList, onLocationClick }) {
  // Extract all anime names (English and Japanese) from arrays
  const getAnimeNames = (location) => {
    if (location?.anime_en_names?.length > 0) {
      return location.anime_en_names.map((name, index) => ({
        en_name: name,
        jp_name: location.anime_names?.[index] || null,
      }));
    }
    if (location?.animeName) {
      return location.animeName.split(",").map((name) => ({
        en_name: name.trim(),
        jp_name: null,
      }));
    }
    return [];
  };
  return (
    <>
      <h2 className="text-3xl font-extrabold tracking-wide flex items-center mb-6">
        {sectionTitle}
      </h2>
      <div className="flex flex-col gap-4 pb-8">
        {locList.map((data) => (
          <div
            key={data.id}
            className="flex bg-white rounded-lg overflow-hidden shadow-md transition-transform duration-300 ease-in-out transform hover:scale-102 cursor-pointer"
            onClick={() => onLocationClick && onLocationClick(data)}
          >
            {/* Left side - Image */}
            <div className="w-1/4 h-48">
              <img
                src={(data.images && data.images[0]) || "/default-image.jpg"}
                alt={data.names}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/default-image.jpg";
                }}
              />
            </div>
            
            {/* Right side - Information */}
            <div className="w-3/4 p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">{data.names}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {data.addresses?.[0] || "No address available"}
                </p>
              </div>
              
              <div>
                <h4 className="text-md font-semibold text-gray-700 mb-2">Related Anime:</h4>
                {data.animeName || (data.anime_en_names && data.anime_en_names.length > 0) ? (
                  <div className="flex flex-wrap gap-2">
                    {getAnimeNames(data).map((anime, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-2 hover:shadow-sm transition-shadow bg-white"
                      >
                        <p className="text-sm font-semibold text-gray-900">
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
                  <p className="text-sm text-gray-500">No related anime information available</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default HorizontalLocationCard;