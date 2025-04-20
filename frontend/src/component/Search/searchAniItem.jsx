import "../../layout/SearchItem.css";
import React from "react";

function SearchAniItem({ icon, title, resultList }) {
  return (
    <>
      <div className=""></div>
      <div className="resultList">
        <p className="sectionTitle">{title}</p>
        {resultList.length > 0 ? (
          <div className="section">
            {resultList.map((result, id) => (
              <div key={`loc-${id}`} className="resultItem">
                {icon && React.createElement(icon)}
                <p className="itemTitle">{result.name}</p>
                {/* <img src={result.images.grid} /> */}
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

export default SearchAniItem;
