import React, { useState, useEffect } from "react";
import axios from "axios";
import DisplayPopAniInfo from "../../components/PopularItem/AniDataInfo";
import DisplayPopLocInfo from "../../components/PopularItem/LocDataInfo";
import SearchBarCity from "../../components/Search/SearchBarCity";
import NavBar from "../../components/Layout/NavBar";
import Footer from "../../components/Layout/Footer"; 
import DatePicker from "../../components/DatePicker/DatePicker";
import LocationPopup from "../../components/LocationPopup/LocationPopup";

/**
 * HomePage component - Main landing page of the Aniway application
 * Displays search functionality, popular destinations, and anime
 */
function HomePage() {
  const [aniData, setAniData] = useState([]);
  const [locData, setLocData] = useState([]);
  const [selectedDates, setSelectedDates] = useState();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedPopupLocation, setSelectedPopupLocation] = useState(null);

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
    console.log("Searching with dates:", selectedDates);
    console.log("Selected location:", selectedLocation);
  };

  // Handle location selection from dropdown
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    console.log("Location selected:", location);
  };

  // Handle search by text
  const handleSearchByText = (searchText) => {
    console.log("Search by text:", searchText);
    // Perform search with the entered text
  };

  // Handle location card click
  const handleLocationCardClick = (location) => {
    setSelectedPopupLocation(location);
  };

  // Close popup
  const handleClosePopup = () => {
    setSelectedPopupLocation(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Fixed Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavBar />
      </div>

      {/* Main Content with top margin to account for fixed header */}
      <div className="container mx-auto px-4 pt-32 pb-8 flex-grow">
        {/* Hero Section with Search */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            PLACE HOLDER PLACE HOLDER PLACE 
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            PLACE HOLDER PLACE HOLDER PLACE HOLDER PLACE HOLDER PLACE HOLDER PLACE HOLDER
            PLACE HOLDER PLACE HOLDER
          </p>

          {/* Search Container */}
          <div className="max-w-4xl mx-auto">
            {/* Search wrapper with flexbox layout */}
            <div className="flex rounded-full bg-white shadow-lg border border-gray-200">
              {/* Search Input - Takes all available space */}
              <div className="flex-grow relative">
                <SearchBarCity 
                  placeholder="Search destinations..."
                  onSelect={handleLocationSelect}
                  onSearch={handleSearchByText}
                />
              </div>
              
              {/* Date Picker - Fixed width */}
              <div className="flex-shrink-0 w-64 border-l border-gray-200">
                <DatePicker 
                  selectedDates={selectedDates}
                  onDateSelect={setSelectedDates}
                />
              </div>
              
              {/* Plan Button */}
              <button 
                className="flex-shrink-0 bg-green-500 hover:bg-green-600 text-white font-medium px-12 h-12 flex items-center justify-center rounded-r-full transition duration-200"
                onClick={handleSearch}
              >
                Plan
              </button>
            </div>
          </div>
        </div>

        {/* Popular Destinations and Anime Sections */}
        <div>
          <DisplayPopLocInfo 
            sectionTitle="Popular Destinations" 
            locList={locData}
            onLocationClick={handleLocationCardClick}
          />
          
          <DisplayPopAniInfo sectionTitle="Popular Anime" aniList={aniData} />
        </div>
      </div>

      {/* Footer Component */}
      <Footer />

      {/* Location Popup */}
      {selectedPopupLocation && (
        <LocationPopup
          location={selectedPopupLocation}
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
}

export default HomePage;