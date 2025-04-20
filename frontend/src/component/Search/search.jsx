import React, { useState } from "react";
import SearchLocItem from "./searchLocItem";
import SearchAniItem from "./searchAniItem";

import { FaSearch } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { MdMovie } from "react-icons/md";
import "../../layout/SearchBar.css";

function SearchBar() {
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [resultLength, setResultLength] = useState(0);
  const [aniResults, setAniResults] = useState([]);
  const [locResults, setLocResults] = useState([]);

  const baseURL = import.meta.env.VITE_BASE_URL;

  const fetchData = async (keyword) => {
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
      setAniResults(data.searchAnime);
      setLocResults(data.searchLocations);
      setResultLength(aniResults.length + locResults.length);
    } catch (error) {
      console.log("Error of search: ", error);
    }
  };

  const handleKeyDown = (e) => {
    console.log("Test key: ", e.key);

    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) => (prev < resultLength - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : resultLength - 1));
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
            onChange={(e) => {
              handleChange(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
        {input && (
          <div className="resultListContainer">
            <SearchLocItem
              icon={FaLocationDot}
              title={"Location"}
              resultList={locResults}
              selectedIndex={selectedIndex}
            />
            <SearchAniItem
              icon={MdMovie}
              title={"Anime"}
              resultList={aniResults}
              selectedIndex={selectedIndex - locResults.length}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default SearchBar;
