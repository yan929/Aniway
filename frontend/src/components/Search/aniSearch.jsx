import React, { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import SearchInput from "./searchInput";
import SearchAniItem from "./searchAniItem";

import { MdMovie } from "react-icons/md";
import "../../layout/SearchBar.css";

function AniSearchBar() {
  const navigate = useNavigate();

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

  return (
    <>
      <div
        className="search mt-4"
        tabIndex={0}
        onFocus={() => {
          if (aniResults.length > 0) {
            setShowResult(true);
          }
        }}
        onBlur={() => setTimeout(() => setShowResult(false), 200)}
      >
        <SearchInput
          resultList={aniResults}
          fetchKeyword={debouncedFetch}
          selectedIndexChange={(index) => setSelectedIndex(index)}
          selectedIndex={selectedIndex}
          onSelecItem={(item) => {
            navigate(`/anime/${item.id}`);
          }}
          inputValue={input}
          onInputChange={(value) => setInput(value)}
        />
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
