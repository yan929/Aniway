import { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import apiClient from "../../util/api";
import { AppContext } from "../../context/AppContext";
import { fetchPlaceByLatLng } from "../../hooks/fetchPlaceByLatLng";
import LocationPopup from "../../components/LocationPopup/LocationPopup";
import HorizontalLocationCard from "../../components/PopularItem/HorizontalLocationCard";

function LocationsSearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { tripData, updateItinerary, selectedDay } = useContext(AppContext);

  const searchQuery = searchParams.get("q");
  const dayIndexParam = searchParams.get("day");
  const showBackButton = searchParams.get("backButton") !== "false"; // Default to showing back button
  
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [addedLocations, setAddedLocations] = useState(new Set());

  // Calculate current day - if dayIndex is provided in URL, use that day, otherwise use selectedDay from context
  const currentDay = dayIndexParam && tripData ? 
    tripData[parseInt(dayIndexParam, 10)] : 
    selectedDay;

  // Handle location card click to show detailed popup
  const handleLocationClick = (location) => {
    setSelectedLocation(location);
  };

  // Handle closing the location popup
  const handleClosePopup = () => {
    setSelectedLocation(null);
  };

  // Handle back button click to return to trip planner
  const handleBackClick = () => {
    navigate("/tripplanner");
  };

  // Function to add a location to the current day's itinerary
  // This closely follows the pattern from TripDayPlan.jsx
  const handleAddToItinerary = async (location) => {
    if (!currentDay) {
      alert("No day selected. Please go to the trip planner first to select a day.");
      return;
    }
    
    try {
      // Structure the location similar to how SearchBar does
      const loc = {
        label: location.name || location.names,
        lat: location.lat,
        lng: location.lng
      };
      
      // Fetch place data exactly like in TripDayPlan
      const newPlaceData = await fetchPlaceByLatLng(loc.label, loc.lat, loc.lng);
      
      // Create the update item exactly like in TripDayPlan
      const updateItem = {
        date: currentDay.date,
        gpPlaceId: newPlaceData.place_id,
        order: currentDay.itinerary ? currentDay.itinerary.length : 0,
      };
      
      // Call updateItinerary exactly like in TripDayPlan
      updateItinerary(tripData, updateItem);
      
      // Mark as added in UI
      setAddedLocations(prev => {
        const newSet = new Set(prev);
        newSet.add(location.id);
        return newSet;
      });
      
      console.log("Added location to itinerary:", location.id);
    } catch (error) {
      console.error("Error adding location to itinerary:", error);
      alert(`Failed to add location to itinerary: ${error.message}`);
    }
  };

  // Function to remove a location from UI state
  const handleRemoveFromItinerary = (location) => {
    setAddedLocations(prev => {
      const newSet = new Set(prev);
      newSet.delete(location.id);
      return newSet;
    });
    console.log("Location removed from UI state:", location.id);
  };

  // Toggle function for adding/removing a location
  const handleToggleInItinerary = (location) => {
    if (addedLocations.has(location.id)) {
      handleRemoveFromItinerary(location);
    } else {
      handleAddToItinerary(location);
    }
  };

  // Fetch locations based on search query
  useEffect(() => {
    const fetchAllLocations = async () => {
      if (!searchQuery) {
        setLocations([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await apiClient.get(`/api/home/search/all`, {
          params: { q: searchQuery },
        });

        setLocations(response.data.searchLocations || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching locations:", err);
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };

    fetchAllLocations();
  }, [searchQuery]);

  return (
    <div className="p-5 max-w-7xl mx-auto relative">
      {/* Fixed position Back to Planner button - shown conditionally */}
      {showBackButton && (
        <button
          onClick={handleBackClick}
          className="fixed top-22 left-8 z-10 inline-flex items-center gap-2 text-blue-500 no-underline text-base hover:underline bg-white px-4 py-2 rounded-lg shadow-md"
        >
          <FaArrowLeft /> Back to Planner
        </button>
      )}
      
      <header className={`mb-8 ${showBackButton ? 'pt-16' : 'pt-4'}`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <h1 className="text-3xl font-bold">Locations for "{searchQuery}"</h1>
          {currentDay && (
            <div className="px-4 py-2 bg-orange-100 rounded-lg mt-2 sm:mt-0">
              <p className="font-semibold">
                Adding to: {new Date(currentDay.date).toLocaleDateString()}
              </p>
            </div>
          )}
          {!currentDay && (
            <div className="px-4 py-2 bg-red-100 rounded-lg mt-2 sm:mt-0">
              <p className="font-semibold text-red-600">
                No day selected! Please go to trip planner first.
              </p>
            </div>
          )}
        </div>
      </header>

      {loading ? (
        <div className="text-center py-10 text-gray-600 text-base">
          Loading locations...
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500 text-base">
          <p>Error: {error}</p>
        </div>
      ) : locations.length > 0 ? (
        <HorizontalLocationCard
          sectionTitle="Search Results"
          locList={locations}
          onLocationClick={handleLocationClick}
          onAddToItinerary={handleAddToItinerary}
          onRemoveFromItinerary={handleRemoveFromItinerary}
          addedLocations={addedLocations}
        />
      ) : (
        <div className="text-center py-10 text-gray-600 text-base">
          <p>No locations found for "{searchQuery}"</p>
        </div>
      )}

      {selectedLocation && (
        <LocationPopup 
          location={selectedLocation} 
          onClose={handleClosePopup}
          onToggleInItinerary={handleToggleInItinerary}
          isAdded={addedLocations.has(selectedLocation.id)}
        />
      )}
    </div>
  );
}

export default LocationsSearchPage;