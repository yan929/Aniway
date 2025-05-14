import React, { useState, useRef, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import apiClient from "../../util/api";
import { FaSearch } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";

function SearchBarCity({ placeholder = "Where?", onSelect, onSearch }) {
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showResult, setShowResult] = useState(false);
  const [searchResults, setSearchResults] = useState({
    cities: [],
    countries: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);

  // Limit display to 5 items per category
  const DISPLAY_LIMIT = 5;

  // Fetch city and country data using the new API
  const fetchData = async (keyword) => {
    if (!keyword.trim()) {
      setSearchResults({ cities: [], countries: [] });
      setShowResult(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.get(
        `/api/home/search/cities-countries`,
        {
          params: { q: keyword.trim() },
        }
      );

      const data = response.data;
      // Limit the results to DISPLAY_LIMIT items per category
      setSearchResults({
        cities: (data.cities || []).slice(0, DISPLAY_LIMIT),
        countries: (data.countries || []).slice(0, DISPLAY_LIMIT),
      });
      setShowResult(true);
    } catch (err) {
      console.error(
        "Search request failed:",
        err.response
          ? `${err.response.status} ${err.response.statusText}`
          : err.message
      );
      setSearchResults({ cities: [], countries: [] });
      setShowResult(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search for better performance
  const debouncedFetch = useDebouncedCallback((keyword) => {
    fetchData(keyword);
  }, 500);

  // Combine cities and countries into a single list for keyboard navigation
  const getAllResults = () => {
    const all = [];
    searchResults.cities.forEach((city) =>
      all.push({ name: city, type: "city" })
    );
    searchResults.countries.forEach((country) =>
      all.push({ name: country, type: "country" })
    );
    return all;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    const allResults = getAllResults();

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < allResults.length - 1 ? prev + 1 : -1
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > -1 ? prev - 1 : allResults.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && allResults[selectedIndex]) {
        handleSelect(allResults[selectedIndex]);
      } else if (input.trim()) {
        handleSearchSubmit();
      }
    } else if (e.key === "Escape") {
      setShowResult(false);
      setSelectedIndex(-1);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const keyword = e.target.value;
    setInput(keyword);
    debouncedFetch(keyword);
    setSelectedIndex(-1);
  };

  // Handle selection
  const handleSelect = (item) => {
    if (onSelect) {
      onSelect(item);
    }
    setInput(item.name);
    setShowResult(false);
    setSelectedIndex(-1);
  };

  // Handle search submission
  const handleSearchSubmit = () => {
    setShowResult(false);
    if (onSearch) {
      onSearch(input.trim());
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResult(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center w-full" ref={searchRef}>
      <div className="flex items-center bg-white w-full rounded-l-full h-12 px-6 dark:bg-gray-800">
        <FaSearch className="text-gray-400 text-lg mr-3 dark:text-gray-200" />
        <input
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (
              input.trim() &&
              (searchResults.cities.length > 0 ||
                searchResults.countries.length > 0)
            ) {
              setShowResult(true);
            }
          }}
          className="flex-grow p-2 text-lg text-gray-800 focus:outline-none bg-transparent dark:text-gray-200 dark:placeholder-gray-400 dark:caret-slate-300"
        />
      </div>

      {showResult &&
        (searchResults.cities.length > 0 ||
          searchResults.countries.length > 0) && (
          <div className="absolute top-full w-full rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col items-start z-50 h-auto mt-1 bg-white dark:bg-gray-800">
            {isLoading ? (
              <div className="w-full px-6 py-3 text-gray-500 dark:text-gray-200">
                Searching...
              </div>
            ) : searchResults.cities.length > 0 ||
              searchResults.countries.length > 0 ? (
              <div className="w-full max-h-[400px] overflow-y-auto">
                {/* Cities Section */}
                {searchResults.cities.length > 0 && (
                  <>
                    <p className="font-bold text-base px-4 py-2 pb-1 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                      Cities
                    </p>
                    {searchResults.cities.map((city, id) => {
                      const currentIndex = id;
                      return (
                        <div
                          key={`city-${id}`}
                          className={`flex items-start px-4 py-2 w-full border-b border-gray-100 dark:border-gray-700 gap-2.5 cursor-pointer transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedIndex === currentIndex
                              ? "bg-gray-50 dark:bg-gray-700"
                              : ""
                            }`}
                          onClick={() =>
                            handleSelect({ name: city, type: "city" })
                          }
                        >
                          <FaLocationDot />
                          <p className="font-semibold m-0 text-sm text-left">
                            {city}
                          </p>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Countries Section */}
                {searchResults.countries.length > 0 && (
                  <>
                    <p className="font-bold text-base px-4 py-2 pb-1 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                      Countries and Regions
                    </p>
                    {searchResults.countries.map((country, id) => {
                      const currentIndex = searchResults.cities.length + id;
                      return (
                        <div
                          key={`country-${id}`}
                          className={`flex items-start px-4 py-2 w-full border-b border-gray-100 dark:border-gray-700 gap-2.5 cursor-pointer transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedIndex === currentIndex
                              ? "bg-gray-50 dark:bg-gray-700"
                              : ""
                            }`}
                          onClick={() =>
                            handleSelect({ name: country, type: "country" })
                          }
                        >
                          <FaLocationDot />
                          <p className="font-semibold m-0 text-sm text-left">
                            {country}
                          </p>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            ) : (
              !isLoading && (
                <p className="noResult dark:text-gray-200">No result found</p>
              )
            )}
          </div>
        )}
    </div>
  );
}

export default SearchBarCity;
