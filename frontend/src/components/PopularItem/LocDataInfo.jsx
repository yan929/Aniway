import React from "react";

function DisplayPopLocInfo({ sectionTitle, locList }) {
  return (
    <>
      <h2 className="text-3xl font-extrabold tracking-wide flex items-center mb-6">
        {sectionTitle}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-8">
        {locList.map((data) => (
          <div
            key={data.id}
            className="relative bg-white rounded-lg overflow-hidden shadow-md object-cover transition-transform duration-300 ease-in-out transform hover:scale-105"
          >
            <img
              src={(data.images && data.images[0]) || "/default-image.jpg"}
              alt={data.names}
              className="w-full h-80 object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default-image.jpg";
              }}
            />

            <div className="p-2">
              <h3 className="text-lg font-bold truncate">{data.names}</h3>
              {data.animeName ? (
                  <p className="text-sm text-gray-500 truncate whitespace-normal break-words line-clamp-3">
                    {data.animeName}
                  </p>
              ) : (
                <p className="text-sm text-gray-500 truncate">Associated anime unavailable</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default DisplayPopLocInfo;