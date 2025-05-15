import { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import apiClient from "../../util/api";
import { AppContext } from "../../context/AppContext";
import { fetchPlaceByLatLng } from "../../hooks/fetchPlaceByLatLng";
import LocationPopup from "../../components/LocationPopup/LocationPopup";
import HorizontalLocationCard from "../../components/PopularItem/HorizontalLocationCard";
import LoadingImage from "../../components/Animation/Loading";
import BackToButton from "../../components/Buttons/BackToButton";

function LocationsSearchPage() {
  const [searchParams] = useSearchParams();
  const { currentTrip, updateItinerary, selectedDay } = useContext(AppContext);

  const searchQuery = searchParams.get("q");
  const dayIndexParam = searchParams.get("day");
  const showBackButton = searchParams.get("backButton") !== "false"; // Default to showing back button

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [addedLocations, setAddedLocations] = useState(new Set());

  const [currentDay, setCurrentDay] = useState(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Handle location card click to show detailed popup
  const handleLocationClick = (location) => {
    setSelectedLocation(location);
  };

  // Handle closing the location popup
  const handleClosePopup = () => {
    setSelectedLocation(null);
  };

  // Function to add a location to the current day's itinerary
  // This closely follows the pattern from TripDayPlan.jsx
  const handleAddToItinerary = async (location) => {
    console.log("Check location:", location);

    if (!currentDay) {
      setToastMessage(
        "No day selected. Please go to the trip planner first to select a day."
      );
      setIsToastVisible(true);

      return;
    }

    try {
      // Structure the location similar to how SearchBar does
      const loc = {
        label: location.name || location.names,
        lat: location.lat,
        lng: location.lng,
      };

      // Fetch place data exactly like in TripDayPlan
      const newPlaceData = await fetchPlaceByLatLng(
        loc.label,
        loc.lat,
        loc.lng
      );

      const currentItinerary = currentDay ? currentDay.itinerary : [];
      // Create the update item exactly like in TripDayPlan
      const updateItem = {
        gpPlaceId: newPlaceData.place_id,
        order: currentItinerary.length,
        arrivalTime: "14:00",
        note: "",
      };

      const newItemArray = [...currentItinerary, updateItem];
      // Call updateItinerary exactly like in TripDayPlan
      updateItinerary(currentDay.date, newItemArray);
      console.log("test location: ", location);

      // Mark as added in UI
      setAddedLocations((prev) => {
        const newSet = new Set(prev);
        newSet.add(location._id);

        return newSet;
      });

      console.log("Added location to itinerary:", location._id);
    } catch (error) {
      setToastMessage(`Failed to add location to itinerary: ${error.message}`);
      setIsToastVisible(true);
    }
  };

  // Function to remove a location from UI state
  const handleRemoveFromItinerary = (location) => {
    setAddedLocations((prev) => {
      const newSet = new Set(prev);
      newSet.delete(location._id);
      return newSet;
    });
    console.log("Location removed from UI state:", location._id);
  };

  // Toggle function for adding/removing a location
  const handleToggleInItinerary = (location) => {
    console.log("Test location: ", location);
    console.log("Test addedlocation: ", addedLocations);

    if (addedLocations.has(location._id)) {
      handleRemoveFromItinerary(location);
    } else {
      handleAddToItinerary(location);
    }
  };

  useEffect(() => {
    let newTargetDay = null;

    if (dayIndexParam != null) {
      // URL specifies a day index
      const parsedIndex = parseInt(dayIndexParam, 10);
      if (currentTrip && currentTrip.content && !isNaN(parsedIndex)) {
        if (parsedIndex >= 0 && parsedIndex < currentTrip.content.length) {
          newTargetDay = currentTrip.content[parsedIndex];
        } else {
          // Invalid index from URL.
          console.error(
            `Day index ${parsedIndex} from URL is out of bounds. Trip content length: ${
              currentTrip.content?.length || 0
            }.`
          );
        }
      }
      // If currentTrip or currentTrip.content is not ready, newTargetDay remains null,
      // and the effect will re-run when currentTrip updates. This is fine.
    } else {
      // No day index in URL, rely on context's selectedDay or a default
      if (selectedDay) {
        newTargetDay = selectedDay;
      } else if (
        currentTrip &&
        currentTrip.content &&
        currentTrip.content.length > 0
      ) {
        // No URL param, no selectedDay from context, but trip has content. Default to first day.
        newTargetDay = currentTrip.content[0];
      }
    }
    // Update state only if the target day (or its absence) is different from the current day
    if (JSON.stringify(currentDay) !== JSON.stringify(newTargetDay)) {
      setCurrentDay(newTargetDay);
    }
  }, [currentTrip, dayIndexParam, selectedDay, currentDay]);

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

        const searchData = response.data;

        setLocations(searchData.locations || []);
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
    <div className="p-5 max-w-7xl mx-auto relative dark:bg-gray-800">
      {/* Fixed position Back to Planner button - shown conditionally */}
      <BackToButton message={"Planner"} page={"tripplanner"} />

      <header className={`mb-8 ${showBackButton ? "pt-16" : "pt-4"}`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <h1 className="text-3xl font-bold">Locations for "{searchQuery}"</h1>
          {currentDay && (
            <div
              className="px-4 py-2 bg-orange-100 dark:bg-[var(--custom-dark-bg)] rounded-lg mt-2 sm:mt-0"
              style={{
                "--custom-dark-bg": "#626fe4",
              }}
            >
              <p className="font-semibold">
                Adding to: {new Date(currentDay.date).toLocaleDateString()}
              </p>
            </div>
          )}
          {!currentDay && (
            <div className="px-4 py-2 bg-red-100 dark:bg-red-800 rounded-lg mt-2 sm:mt-0">
              <p className="font-semibold text-red-600 dark:text-white">
                No day selected! Please go to trip planner first.
              </p>
            </div>
          )}
        </div>
      </header>

      {loading ? (
        <div className="text-center py-10 text-gray-600 dark:text-white text-base">
          <LoadingImage />
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500 dark:text-white text-base">
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
        <div className="text-center py-10 text-gray-600 dark:text-white text-base">
          <p>No locations found for "{searchQuery}"</p>
        </div>
      )}

      {selectedLocation && (
        <LocationPopup
          location={selectedLocation}
          onClose={handleClosePopup}
          onToggleInItinerary={handleToggleInItinerary}
          isAdded={addedLocations.has(selectedLocation._id)}
        />
      )}

      {isToastVisible && (
        <ErrorToast message={toastMessage} onClose={handleCloseToast} />
      )}
    </div>
  );
}

export default LocationsSearchPage;
