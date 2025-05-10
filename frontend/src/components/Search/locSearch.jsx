import React, { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import axios from "axios";

import SearchInput from "./searchInput";
import SearchLocItem from "./searchLocItem";

import { FaLocationDot } from "react-icons/fa6";
import "../../layout/SearchBar.css";

function LocSearchBar({ setSelectedLocation }) {
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
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

  const handleSelectLocation = (loc) => {
    setSelectedLocation({
      lat: loc.lat,
      lng: loc.lng,
      label: loc.name,
    });
    setInput(loc.name);
    setShowResult(false);
  };

  return (
    <>
      <div
        className="relative flex flex-col items-center"
        tabIndex={0}
        onFocus={() => {
          if (locResults.length > 0) {
            setShowResult(true);
          }
        }}
        onBlur={() => setTimeout(() => setShowResult(false), 200)}
      >
        <SearchInput
          resultList={locResults}
          fetchKeyword={debouncedFetch}
          selectedIndexChange={(index) => setSelectedIndex(index)}
          selectedIndex={selectedIndex}
          onSelecItem={handleSelectLocation}
          inputValue={input}
          onInputChange={(value) => setInput(value)}
        />

        {showResult && (
          <div className="absolute top-full bg-white w-1/2 rounded-[10px] px-[15px] shadow-md flex flex-col items-start z-10">
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
