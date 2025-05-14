import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import DisplayPopAniInfo from "../../components/PopularItem/AniDataInfo";
import DisplayPopLocInfo from "../../components/PopularItem/LocDataInfo";
import SearchBarCity from "../../components/Search/SearchBarCity";
import DatePicker from "../../components/DatePicker/DatePicker";
import LocationPopup from "../../components/LocationPopup/LocationPopup";
import DisplayContactBanner from "../../components/Contact/ContactBanner";
import WaveText from "../../components/Animation/TextWave";
import { AppContext } from "../../context/AppContext";
import apiClient from "../../util/api";

/**
 * HomePage component - Main landing page of the Aniway application
 * Displays search functionality, popular destinations, and anime
 */
function HomePage() {
  const [aniData, setAniData] = useState([]);
  const [locData, setLocData] = useState([]);
  const [selectedDates, setSelectedDates] = useState(null); // Initialize as null instead of default date range
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedPopupLocation, setSelectedPopupLocation] = useState(null);

  // Access the context for transferring data to TripPlanner
  const { setTripDetails } = useContext(AppContext);
  const navigate = useNavigate();

  // Fetch trending data on component mount
  useEffect(() => {
    const fetchDataOnMount = async () => {
      try {
        const response = await apiClient.get(`/api/home/trending`);
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

  // Handle search submission and transfer data to TripPlanner
  const handleSearch = () => {
    // Check if both location and a COMPLETE date range (start AND end) are selected
    if (
      selectedLocation &&
      selectedDates &&
      selectedDates.startDate &&
      selectedDates.endDate
    ) {
      // Generate trip title based on selected location
      const tripTitle = `Trip to ${
        selectedLocation.name || selectedLocation.description || "Destination"
      }`;

      // Transfer data to AppContext for use in TripPlanner
      setTripDetails(selectedLocation, tripTitle, selectedDates);

      // Navigate to the trip planner page
      navigate("/tripplanner");
    } else {
      // Prompt user to select destination and dates
      alert(
        "Please select a destination and a complete travel date range (start and end date)."
      );
    }
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
    // Container with responsive padding for better mobile experience
    <div className="container mx-auto px-4 pt-16 md:pt-24 lg:pt-32 pb-8 flex-grow dark:text-gray-100  dark:bg-gray-900">
      {/* Hero Section with Search - Optimized spacing for mobile */}
      <div className="text-center mb-8 md:mb-12 lg:mb-16">
        {/* Responsive heading sizes */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-3 md:mb-6">
          <WaveText
            className="dark:text-gray-100"
            text="Aniway — The Anime Traveler's Way"
          />
        </h1>
        {/* Responsive paragraph with optimized spacing */}
        <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 lg:mb-12 max-w-3xl mx-auto dark:text-gray-100  dark:bg-gray-900">
          From screen to scenes, find the anime in your adventure.
          <br className="hidden md:block dark:text-gray-100  dark:bg-gray-900" />
          Find your scene, live your dream!
        </p>

        {/* Search Container */}
        <div className="max-w-4xl mx-auto px-2 md:px-4 relative">
          {/* Search wrapper with flexbox and responsive layout */}
          <div className="flex flex-col md:flex-row rounded-lg md:rounded-full bg-white shadow-lg border border-gray-200 overflow-visible">
            {/* Search Input - Takes all available space */}
            <div className="flex-grow relative">
              <SearchBarCity
                placeholder="Search destinations..."
                onSelect={handleLocationSelect}
                onSearch={handleSearchByText}
              />
            </div>

            {/* Date Picker - Full width on small screens, fixed width on medium+ screens */}
            <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-gray-200 relative">
              <DatePicker
                selectedDates={selectedDates}
                onDateSelect={setSelectedDates}
              />
            </div>

            {/* Plan Button - Full width on small screens, auto width on medium+ screens */}
            <button
              className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-medium px-8 py-3 md:py-0 md:px-12 md:h-12 flex items-center justify-center md:rounded-r-full transition duration-200"
              onClick={handleSearch}
            >
              Plan
            </button>
          </div>
        </div>
      </div>

      {/* Popular Destinations and Anime Sections with reduced top spacing */}
      <div className="mt-6 md:mt-8">
        <DisplayPopLocInfo
          sectionTitle="Popular Destinations"
          locList={locData}
          onLocationClick={handleLocationCardClick}
        />

        <DisplayPopAniInfo sectionTitle="Popular Anime" aniList={aniData} />
      </div>

      {/* Location Popup - Shown when a location card is clicked */}
      {selectedPopupLocation && (
        <LocationPopup
          location={selectedPopupLocation}
          onClose={handleClosePopup}
        />
      )}

      <br />
      <DisplayContactBanner />
    </div>
  );
}

export default HomePage;
