import React, { useState, useEffect } from "react";
import axios from "axios";
import DisplayPopAniInfo from "../../components/PopularItem/AniDataInfo";
import DisplayPopLocInfo from "../../components/PopularItem/LocDataInfo";
import SearchBar from "../../components/Search/search";
import NavBar from "../../components/Navbar/NavBar";
import DatePicker from "../../components/DatePicker/DatePicker";

/**
 * HomePage component - Main landing page of the Aniway application
 * Displays search functionality, popular destinations, and anime
 */
function HomePage() {
  const [aniData, setAniData] = useState([]);
  const [locData, setLocData] = useState([]);
  const [selectedDates, setSelectedDates] = useState({ start: "04/10", end: "05/08" });

  // Fetch trending data on component mount
  useEffect(() => {
    const fetchDataOnMount = async () => {
      try {
        const response = await axios.get(`/api/home/trending`);
        const data = response.data;
        setAniData(data.trendingAnime);
        setLocData(data.trendingLocations);
      } catch (error) {
        console.error(
          "Error fetching trending data: ",
          error.response
            ? `${error.response.status} ${error.response.statusText}`
            : error.message
        );
      }
    };

    fetchDataOnMount();
  }, []);

  // Handle search submission
  const handleSearch = () => {
    // Implement search functionality with the selected dates
    console.log("Searching with dates:", selectedDates);
    // You would typically make an API call here with the search parameters
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Fixed Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavBar />
      </div>

      {/* Fixed Search Container - using padding instead of margin */}
      <div className="fixed top-14 left-0 right-0 z-40 bg-white pt-20 pb-20">
        <div className="container mx-auto px-4">
          <div className="w-7/10 mx-auto">
            {/* Search wrapper with flexbox layout*/}
            <div className="flex rounded-full bg-white shadow">
              {/* Search Input - Takes all available space */}
              <div className="flex-grow relative">
                <SearchBar />
              </div>
              
              {/* Date Picker - Fixed width */}
              <div className="flex-shrink-0 w-48 border-l border-gray-200 bg-gray-100">
                <DatePicker 
                  selectedDates={selectedDates}
                  onDateSelect={setSelectedDates}
                />
              </div>
              
              {/* Search Button - Matching design with consistent height */}
              <button 
                className="flex-shrink-0 bg-green-500 hover:bg-green-600 text-white px-8 h-10 flex items-center justify-center transition duration-200"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with top margin to account for fixed header */}
      <div className="container mx-auto px-4 pt-[240px] pb-8">
        {/* Popular Destinations and Anime Sections */}
        <div>
          <DisplayPopLocInfo 
            sectionTitle="Popular Destinations" 
            locList={locData}
          />
          
          <DisplayPopAniInfo sectionTitle="Popular Anime" aniList={aniData} />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
