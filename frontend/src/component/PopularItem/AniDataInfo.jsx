import React from "react";

function DisplayPopAniInfo({ sectionTitle, aniList }) {
  return (
    <>
      <h2 className="text-3xl font-extrabold tracking-wide flex items-center mb-6">
        {sectionTitle}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-8">
        {aniList.map((data) => (
          <div
            key={data.id}
            className="relative bg-white rounded-lg overflow-hidden shadow-md  object-cover transition-transform duration-300 ease-in-out transform hover:scale-105"
          >
            <img
              src={data.images.large}
              alt={data.name}
              className="w-full h-80 object-cover"
            />

            <div className="p-2">
              <h3 className="text-lg font-bold truncate">{data.name}</h3>
              {data.addresses ? (
                <p className="text-sm text-gray-500 truncate whitespace-normal break-words">
                  {data.addresses[0]}
                </p>
              ) : (
                <p className="text-sm text-gray-500 truncate">Description...</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default DisplayPopAniInfo;
