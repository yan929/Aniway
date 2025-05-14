import { FaSearch } from "react-icons/fa";

function SearchInput({
  resultList,
  fetchKeyword,
  selectedIndexChange,
  selectedIndex,
  onSelectItem,
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
        onSelectItem(selectedItem);
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
      <div className="bg-white dark:bg-gray-800 w-full rounded-[10px] h-10 px-[15px] shadow-[0_0_8px_#ddd] dark:shadow-[0_0_1px_#333] flex items-center">
        <FaSearch id="search-icon" className="text-gray-600 dark:text-gray-300" />
        <input
          type="text"
          placeholder="Search by anime name or location..."
          className="w-full h-full outline-none border-none focus:ring-0 placeholder-gray-500 dark:placeholder-gray-500 bg-transparent text-gray-800 dark:text-gray-300"
          value={inputValue ?? ""}
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