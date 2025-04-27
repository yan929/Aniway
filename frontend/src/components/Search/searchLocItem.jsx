import React from "react";
import { Link } from "react-router-dom"; 

function SearchLocItem({
  icon,
  title,
  resultList,
  selectedIndex,
  onSelectLocation,
  searchTerm,
}) {
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
          {resultList.map((result, id) => (
            <div
              key={`loc-${id}`}
              className={`flex items-start px-4 py-2 w-full border-b border-gray-100 gap-2.5 cursor-pointer transition-colors duration-200 hover:bg-gray-50 ${
                selectedIndex === id ? "bg-gray-50" : ""
              }`}
              onClick={() => handleResultClick(result)}
            >
              <div className="itemIcon">
                {icon && React.createElement(icon)}
              </div>
              <div className="flex flex-col">
                <p className="font-semibold m-0 text-sm text-left">{result.name}</p>
                <p className="text-sm m-0 text-gray-600 text-left">{result.addresses[0]}</p>
              </div>
            </div>
          ))}
          <Link 
            to={`/locations/search?q=${encodeURIComponent(searchTerm || '')}`} 
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