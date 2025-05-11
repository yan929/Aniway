import React from "react";
import { Navigate, useNavigate } from "react-router-dom";

function SearchAniItem({ icon, title, resultList, selectedIndex }) {
  const navigate = useNavigate();
  return (
    <div className="w-full">
      <p className="font-bold text-base px-4 py-2 pb-1 text-gray-800 border-b border-gray-200">
        {title}
      </p>
      {resultList.length > 0 ? (
        <div className="w-full">
          {resultList.map((result, id) => (
            <div
              key={`ani-${id}`}
              className={`flex items-start px-4 py-2 w-full border-b border-gray-100 gap-2.5 cursor-pointer transition-colors duration-200 hover:bg-gray-50 ${
                selectedIndex === id ? "bg-gray-50" : ""
              }`}
              onClick={() => {
                navigate(`/anime/${result.id}`);
              }}
            >
              {icon && React.createElement(icon)}
              <p className="font-semibold m-0 text-sm text-left">
                {result.name}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="noResult">No result found</p>
      )}
    </div>
  );
}

export default SearchAniItem;
