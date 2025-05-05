import React, { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import axios from "axios";

import SearchLocItem from "./searchLocItem";

import { FaSearch } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import "../../layout/SearchBar.css";

function LocSearchBar({ setSelectedLocation }) {
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [resultLength, setResultLength] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [locResults, setLocResults] = useState([]);

  const fetchData = async (keyword) => {
    if (!keyword.trim()) {
      setLocResults([]);
      setShowResult(false);
      return;
    }

    try {
      const response = await axios.get(`/api/home/search`, {
        params: { q: keyword },
      });

      const data = response.data;

      const locations = data.searchLocations || [];
      setLocResults(locations);

      setShowResult(true);
    } catch (err) {
      console.error(
        "Search request failed:",
        err.response
          ? `${err.response.status} ${err.response.statusText}`
          : err.message
      );
      setLocResults([]);
      setShowResult(false);
    }
  };

  // Debounce hook with 500 ms
  const debouncedFetch = useDebouncedCallback((keyword) => {
    fetchData(keyword);
  }, 500);

  // Keyboard control
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) => (prev < locResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : locResults.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      const selectedItem = locResults[selectedIndex];
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
      <div className="search mt-4">
        <div className="searchInputs">
          <FaSearch id="search-icon" />
          <input
            type="text"
            placeholder="Search loc..."
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
              searchTerm={input}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default LocSearchBar;
