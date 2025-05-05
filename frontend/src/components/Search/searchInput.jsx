import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";

function SearchInput({
  resultList,
  fetchKeyword,
  selectedIndexChange,
  selectedIndex,
  onSelecItem,
  inputValue,
  onInputChange,
}) {
  // Keyboard control
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      selectedIndexChange((prev) =>
        prev < resultList.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      selectedIndexChange((prev) =>
        prev > 0 ? prev - 1 : resultList.length - 1
      );
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      const selectedItem = resultList[selectedIndex];
      if (selectedItem) {
        onSelecItem(selectedItem);
      }
    }
  };

  const handleChange = (keyword) => {
    onInputChange(keyword);
    fetchKeyword(keyword);
    selectedIndexChange(-1);
  };

  return (
    <>
      <div className="searchInputs">
        <FaSearch id="search-icon" />
        <input
          type="text"
          placeholder="Search..."
          value={inputValue}
          onChange={(e) => {
            handleChange(e.target.value);
            selectedIndexChange(-1);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>
    </>
  );
}

export default SearchInput;
