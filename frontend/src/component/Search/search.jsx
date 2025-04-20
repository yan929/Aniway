import React, { useState } from "react";
import SearchLocItem from "./searchLocItem";
import SearchAniItem from "./searchAniItem";

import { FaSearch } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { MdMovie } from "react-icons/md";
import "../../layout/SearchBar.css";

function SearchBar() {
  const [input, setInput] = useState("");
  const [aniResults, setAniResults] = useState([]);
  const [locResults, setLocResults] = useState([]);

  const baseURL = import.meta.env.VITE_BASE_URL;

  const fetchData = async (keyword) => {
    console.log("Test keyword:", keyword);

    if (!keyword.trim()) {
      setAniResults([]);
      setLocResults([]);
      return;
    }

    try {
      const response = await fetch(`${baseURL}/home/search?q=${keyword}`);
      if (!response) {
        throw new Error("Search fail");
      }
      const data = await response.json();
      console.log("Received data: ", data);

      console.log("Ani get: ", data.searchAnime);
      console.log("Loc get: ", data.searchLocations);

      setAniResults(data.searchAnime);
      setLocResults(data.searchLocations);
    } catch (error) {
      console.log("Error of search: ", error);
    }
  };

  const handleChange = (keyword) => {
    setInput(keyword);
    fetchData(keyword);
  };

  return (
    <>
      <div className="search">
        <div className="searchInputs">
          <FaSearch id="search-icon" />
          <input
            type="text"
            placeholder="Search..."
            value={input}
            onChange={(e) => handleChange(e.target.value)}
          />
        </div>
        {input && (
          <div className="resultListContainer">
            <SearchLocItem
              icon={FaLocationDot}
              title={"Location"}
              resultList={locResults}
            />
            <SearchAniItem
              icon={MdMovie}
              title={"Anime"}
              resultList={aniResults}
            />
            {/* <div className="aniList">
              {aniResults.length > 0 && (
                <div className="section">
                  <p className="sectionTitle">Anime</p>
                  {aniResults.map((result, id) => (
                    <div key={`ani-${id}`} className="resultItem">
                      <p className="itemTitle">{result.name}</p>
                      <p className="itemInfo">{result.address}</p>
                    </div>
                  ))}
                </div>
              )}
            </div> */}
          </div>
        )}
      </div>
    </>
  );
}

export default SearchBar;
