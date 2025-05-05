import "../../layout/SearchItem.css";
import React from "react";
import { Navigate, useNavigate } from "react-router-dom";

function SearchAniItem({ icon, title, resultList, selectedIndex }) {
  const navigate = useNavigate();
  return (
    <>
      <div className="resultList">
        <p className="sectionTitle">{title}</p>
        {resultList.length > 0 ? (
          <div className="section">
            {resultList.map((result, id) => (
              <div
                key={`ani-${id}`}
                className={`resultItem ${selectedIndex === id ? "active" : ""}`}
                onClick={() => navigate(`/anime/${result.id}`)}
              >
                {icon && React.createElement(icon)}
                <p className="itemTitle">{result.name}</p>
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
