import React, { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import SearchLocItem from "./searchLocItem";
import SearchAniItem from "./searchAniItem";

import { FaSearch } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { MdMovie } from "react-icons/md";
import "../../layout/SearchBar.css";

function SearchBar({ setSelectedLocation }) {
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [resultLength, setResultLength] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [aniResults, setAniResults] = useState([]);
  const [locResults, setLocResults] = useState([]);

  const baseURL = import.meta.env.VITE_BACKEND_API;

  const fetchData = async (keyword) => {
    if (!keyword.trim()) {
      setAniResults([]);
      setLocResults([]);
      setShowResult(false);
      return;
    }

    try {
      const response = await fetch(`${baseURL}/api/home/search?q=${keyword}`);
      if (!response) {
        throw new Error("Search fail");
      }
      const data = await response.json();

      setAniResults(data.searchAnime);
      setLocResults(data.searchLocations);
      setResultLength(aniResults.length + locResults.length);
      setShowResult(true);
    } catch (error) {
      console.log("Error of search: ", error);
      setShowResult(false);
    }
  };

  // Debounce hook with 500 ms
  const debouncedFetch = useDebouncedCallback((keyword) => {
    fetchData(keyword);
  }, 500);

  // Keyboard control
  const handleKeyDown = (e) => {
    const allResults = [...locResults, ...aniResults];

    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) => (prev < resultLength - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : resultLength - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      const selectedItem = allResults[selectedIndex];
      if (selectedItem) {
        handleSelectLocation({
          lat: selectedItem.lat,
          lng: selectedItem.lng,
          label: selectedItem.name,
        });
      }
    }
  };

  const handleChange = (keyword) => {
    setInput(keyword);
    debouncedFetch(keyword);
    setSelectedIndex(-1);
  };

  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    setInput("");
    setShowResult(false);
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
        {showResult && (
          <div className="resultListContainer">
            <SearchLocItem
              icon={FaLocationDot}
              title={"Location"}
              resultList={locResults}
              selectedIndex={selectedIndex}
              onSelectLocation={(loc) => handleSelectLocation(loc)}
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
