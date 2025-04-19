import { FaSearch } from "react-icons/fa";

import "../../layout/SearchBar.css";
import React, { useState } from "react";

function SearchBar() {
  const [input, setInput] = useState("");

  const fetchData = (value) => {
    fetch("https://jsonplaceholder.typicode.com/users")
      .then((response) => response.json())
      .then((json) => {
        const results = json.filter((user) => {
          return user && user.name && user.name.toLowerCase().include(value);
        });
        console.log(results);
      });
  };

  const handleChange = (value) => {
    setInput(value);
    fetchData(value);
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
            onChange={(e) => handleChange(e.target.value)}
          />
        </div>

        <div className="resultList">
            
        </div>
      </div>
    </>
  );
}

export default SearchBar;
