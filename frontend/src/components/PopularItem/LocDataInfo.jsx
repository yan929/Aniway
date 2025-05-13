import React from "react";

function DisplayPopLocInfo({ sectionTitle, locList, onLocationClick }) {
  return (
    <>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide">
          {sectionTitle}
        </h2>
        {/* Show scrolling hint on all screens except XL */}
        <span className="text-xs text-gray-500 xl:hidden">← Scroll for more →</span>
      </div>
      
      {/* Only use grid layout on XL screens (1280px+), horizontal scrolling for all others */}
      <div className="xl:grid xl:grid-cols-5 xl:gap-4 pb-6 md:pb-8 overflow-x-auto flex xl:block -mx-4 xl:mx-0 px-4 xl:px-0">
        {locList.map((data) => (
          <div
            key={data.id}
            className="relative bg-white rounded-lg overflow-hidden shadow-md transition-transform duration-300 ease-in-out transform hover:scale-105 cursor-pointer flex-none mr-3 xl:mr-0 xl:mb-4 w-40 sm:w-48 md:w-56 lg:w-64 xl:w-auto flex flex-col"
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
