import "../../layout/SearchItem.css";
import React from "react";

function SearchLocItem({ icon, title, resultList, selectedIndex }) {
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
          </div>
        ) : (
          <p className="noResult">No result found</p>
        )}
      </div>
    </>
  );
}

export default SearchLocItem;
