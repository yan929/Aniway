import React, { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import apiClient from "../util/api";

import SearchLocItem from "./searchLocItem";
import SearchAniItem from "./searchAniItem";

import { FaSearch } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { MdMovie } from "react-icons/md";

function SearchBar({ setSelectedLocation }) {
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [resultLength, setResultLength] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [aniResults, setAniResults] = useState([]);
  const [locResults, setLocResults] = useState([]);

  const fetchData = async (keyword) => {
    if (!keyword.trim()) {
      setAniResults([]);
      setLocResults([]);
      setShowResult(false);
      return;
    }

    try {
      const response = await apiClient.get(`/api/home/search`, {
        params: { q: keyword },
      });

      const data = response.data;

      const anime = data.searchAnime || [];
      const locations = data.searchLocations || [];
      setAniResults(anime);
      setLocResults(locations);
      setResultLength(anime.length + locations.length);
      setShowResult(true);
    } catch (err) {
      console.error(
        "Search request failed:",
        err.response
          ? `${err.response.status} ${err.response.statusText}`
          : err.message
      );
      setAniResults([]);
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
      <div className="relative flex flex-col items-center">
        <div className="flex items-center bg-white w-full rounded-l-full h-10 px-4">
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
            className="bg-transparent border-none h-full text-base w-full ml-1.5 focus:outline-none"
          />
        </div>
        {showResult && (
          <div className="absolute top-full bg-white w-full rounded-lg px-4 shadow-md flex flex-col items-start z-10 h-auto">
            <SearchLocItem
              icon={FaLocationDot}
              title={"Location"}
              resultList={locResults}
              selectedIndex={selectedIndex}
              onSelectLocation={(loc) => handleSelectLocation(loc)}
              searchTerm={input}
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
