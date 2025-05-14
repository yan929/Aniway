import React, { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import apiClient from "../../util/api";

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
      const searchResponse = await apiClient.get(`/api/home/search`, {
        params: { q: keyword },
      });
      const searchData = searchResponse.data;

      const combinedLocations = [
        ...(searchData.searchLocations || []),
        ...(searchData.searchAnimeLocations || []),
      ];

      setLocResults(combinedLocations);

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

  // Debounce hook with 200 ms
  const debouncedFetch = useDebouncedCallback((keyword) => {
    fetchData(keyword);
  }, 200);

  const handleSelectLocation = (loc) => {
    setSelectedLocation({
      label: loc.label,//very important: will cause placeid returen vague if not using label or null
      lat: loc.lat,
      lng: loc.lng,
      gpPlaceId: loc.googlePlaceId,
    });
    setInput("");
    setShowResult(false);
    setLocResults([]);
  };

  return (
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
        onSelectItem={handleSelectLocation}
        inputValue={input}
        onInputChange={(value) => setInput(value)}
      />

      {showResult && (
        <div className="absolute top-full bg-white dark:bg-gray-800 w-full rounded-[10px] px-[15px] shadow-md flex flex-col items-start z-20 dark:border dark:border-gray-700">
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
  );
}

export default LocSearchBar;
