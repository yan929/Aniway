import React, { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import axios from "axios";

import SearchAniItem from "./searchAniItem";

import { FaSearch } from "react-icons/fa";
import { MdMovie } from "react-icons/md";
import "../../layout/SearchBar.css";

function AniSearchBar() {
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showResult, setShowResult] = useState(false);
  const [aniResults, setAniResults] = useState([]);

  const fetchData = async (keyword) => {
    if (!keyword.trim()) {
      setAniResults([]);
      setShowResult(false);
      return;
    }

    try {
      const response = await axios.get(`/api/home/search`, {
        params: { q: keyword },
      });

      const data = response.data;

      const anime = data.searchAnime || [];
      setAniResults(anime);
      setShowResult(true);
    } catch (err) {
      console.error(
        "Search request failed:",
        err.response
          ? `${err.response.status} ${err.response.statusText}`
          : err.message
      );
      setAniResults([]);
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
      setSelectedIndex((prev) => (prev < aniResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : aniResults.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      const selectedItem = aniResults[selectedIndex];
      if (selectedItem) {
        console.log("Testt selected item: ", selectedItem);
      }
    }
  };

  const handleChange = (keyword) => {
    setInput(keyword);
    debouncedFetch(keyword);
    setSelectedIndex(-1);
  };

  return (
    <>
      <div className="search mt-4">
        <div className="searchInputs">
          <FaSearch id="search-icon" />
          <input
            type="text"
            placeholder="Search anime..."
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
            <SearchAniItem
              icon={MdMovie}
              title={"Anime"}
              resultList={aniResults}
              selectedIndex={selectedIndex}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default AniSearchBar;
