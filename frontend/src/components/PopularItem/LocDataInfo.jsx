import React from "react";

function DisplayPopLocInfo({ sectionTitle, locList, onLocationClick }) {
  return (
    <>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide">
          {sectionTitle}
        </h2>
        {/* Show scrolling hint on all screen sizes */}
        <span className="text-xs text-gray-500">← Scroll for more →</span>
      </div>
      
      {/* Horizontal scrolling on ALL screen sizes */}
      <div className="overflow-x-auto flex -mx-4 px-4 pb-6 md:pb-8">
        {locList.map((data) => (
          <div
            key={data.id}
            className="relative bg-white rounded-lg overflow-hidden shadow-md transition-transform duration-300 ease-in-out transform hover:scale-105 cursor-pointer flex-none mr-3 w-40 sm:w-48 md:w-56 lg:w-64 xl:w-72 flex flex-col"
            onClick={() => onLocationClick && onLocationClick(data)}
          >
            {/* Maintain consistent aspect ratio */}
            <div className="relative pb-[130%]">
              <img
                src={(data.images && data.images[0]) || "/default-image.jpg"}
                alt={data.names}
                className="absolute top-0 left-0 w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/default-image.jpg";
                }}
              />
            </div>

            <div className="p-2 md:p-3 flex-grow">
              <h3 className="text-sm md:text-lg font-bold truncate">{data.names}</h3>
              {data.animeName ? (
                <p className="text-xs md:text-sm text-gray-500 whitespace-normal break-words line-clamp-1 md:line-clamp-2">
                  {data.animeName}
                </p>
              ) : (
                <p className="text-xs md:text-sm text-gray-500 truncate">Associated anime unavailable</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default DisplayPopLocInfo;
