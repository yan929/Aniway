import "../../layout/SearchItem.css";
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
    <>
      <div className="resultList">
        <p className="sectionTitle">{title}</p>
        {resultList.length > 0 ? (
          <div className="section">
            {resultList.map((result, id) => (
              <div
                key={`loc-${id}`}
                className={`resultItem ${selectedIndex === id ? "active" : ""}`}
                onClick={() => handleResultClick(result)}
              >
                <div className="itemIcon">
                  {icon && React.createElement(icon)}{" "}
                </div>
                <div className="itemContent">
                  <p className="itemTitle">{result.name}</p>
                  <p className="itemAddress">{result.addresses[0]}</p>
                </div>
              </div>
            ))}{" "}
            <Link 
              to={`/locations/search?q=${encodeURIComponent(searchTerm || '')}`} 
              className="findMoreLocations"
            >
              Find more locations
            </Link>
          </div>
        ) : (
          <p className="noResult">No result found</p>
        )}
      </div>
    </>
  );
}

export default SearchLocItem;
