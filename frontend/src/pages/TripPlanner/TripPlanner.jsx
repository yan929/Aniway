import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../../components/TripPlanner/Sidebar.jsx";
import TripHeader from "../../components/TripPlanner/TripHeader.jsx";
import ItinerarySection from "../../components/TripPlanner/ItinerarySection.jsx";
import ChatWindow from "../../components/AIChat/ChatWindow.jsx";
import TripMapDisplay from "../../components/TripPlanner/TripMapDisplay.jsx"; // Added import
import { AppContext } from "../../context/AppContext.jsx";
import apiClient from "../../util/api.js"; // Added import

export default function TripPlanner() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { currentTrip, tripLocation, replaceEntireTrip } =
    useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation(); // Get current location

  // Effect to add/remove class from body based on route
  useEffect(() => {
    const rootElement = document.body; // Target body for class manipulation
    if (location.pathname === '/tripplanner') {
      rootElement.classList.add('root-fullscreen');
    } else {
      rootElement.classList.remove('root-fullscreen');
    }
    // Cleanup function to remove the class if the component unmounts
    // or if the path changes away from /tripplanner before unmount
    return () => {
      rootElement.classList.remove('root-fullscreen');
    };
  }, [location.pathname]); // Re-run effect if location.pathname changes

  // Ref to store the refs of each day section from ItinerarySection
  const daySectionRefs = useRef({});

  // Callback function for ItinerarySection to pass up its refs
  const handleRefsCreated = (refs) => {
    daySectionRefs.current = refs;
  };

  // Function to scroll to a specific day
  const scrollToDay = (date) => {
    const ref = daySectionRefs.current[date];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      console.warn(`Ref for date ${date} not found.`);
    }
  };

  // Check if trip data exists when component mounts
  useEffect(() => {
    // If tripData or tripLocation is missing, you might want to redirect or show a message
    if (!currentTrip || !tripLocation) {
      console.warn(
        "Missing trip data or location. Consider selecting destination and dates from the homepage."
      );
      // Optional: Uncomment to redirect back to homepage if no data
      // navigate('/');
    }
  }, [currentTrip, tripLocation, navigate]);

  // Toggle chat window visibility
  const toggleChatWindow = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Handle suggestions from the AI chat
  const handleApplySuggestion = async (suggestion) => {
    console.log("Original suggestion to apply to trip plan:", suggestion);

    try {
      const updatedContent = await Promise.all(
        (suggestion.content || []).map(async (day) => {
          const updatedItineraryWithPotentialNulls = await Promise.all(
            (day.itinerary || []).map(async (item) => {
              if (item.lat == null || item.lng == null) {
                console.warn("Skipping item due to missing lat/lng:", item);
                return null; // Return null to be filtered out later
              }
              try {
                const response = await apiClient.post(
                  `/api/gmap/place_by_latlng`,
                  {
                    lat: item.lat,
                    lng: item.lng,
                  }
                );
                const placeData = response.data; // Renamed for clarity

                if (
                  !placeData ||
                  !placeData.place_id ||
                  !placeData.name ||
                  placeData.name.toLowerCase() === "unknown"
                ) {
                  console.warn(
                    `Skipping item due to missing place_id, name, or 'Unknown' name for lat: ${item.lat}, lng: ${item.lng}. Data:`,
                    placeData
                  );
                  return null; // Return null to be filtered out
                }

                // Return a new object with all original item fields, plus gpPlaceId and essential display data
                return {
                  ...item,
                  gpPlaceId: placeData.place_id,
                  name: placeData.name, // Store the name
                };
              } catch (error) {
                if (error.response) {
                  console.error(
                    `Error fetching place ID for lat: ${item.lat}, lng: ${item.lng}. Status: ${error.response.status}, Data:`,
                    error.response.data
                  );
                } else if (error.request) {
                  console.error(
                    `Error fetching place ID for lat: ${item.lat}, lng: ${item.lng}. No response received:`,
                    error.request
                  );
                } else {
                  console.error(
                    `Exception fetching place ID for lat: ${item.lat}, lng: ${item.lng}:`,
                    error.message
                  );
                }
                return null; // Return null on error to be filtered out
              }
            })
          );
          // Filter out items that are null (due to errors, missing lat/lng, or insufficient place data)
          const updatedItinerary = updatedItineraryWithPotentialNulls.filter(
            (item) => item != null
          );
          return { ...day, itinerary: updatedItinerary };
        })
      );

      const updatedSuggestion = {
        ...suggestion,
        content: updatedContent,
        image:
          updatedContent[0]?.itinerary[0]?.image ||
          "https://placehold.co/300x200?text=No+Image",
        destination:
          updatedContent.length > 0 &&
            updatedContent[updatedContent.length - 1].itinerary.length > 0
            ? updatedContent[updatedContent.length - 1].itinerary[
              updatedContent[updatedContent.length - 1].itinerary.length - 1
            ].city || undefined
            : undefined,
      };
      console.log(
        "Applying updated suggestion to trip plan:",
        updatedSuggestion
      );

      replaceEntireTrip(updatedSuggestion);
    } catch (error) {
      console.error("Error processing suggestions:", error);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <Sidebar onToggleChat={toggleChatWindow} onScrollToDay={scrollToDay} />
      <main className="flex-1 overflow-y-auto bg-gray-100">
        {" "}
        {/* Added padding for ItinerarySection */}
        <TripHeader />
        <ItinerarySection onRefsCreated={handleRefsCreated} />
      </main>
      <div className="w-3/7 bg-gray-200 overflow-y-auto">
        {" "}
        {/* Added a container for the map */}
        {/* <TripMapDisplay /> */}
        {/* Replaced commented out MapPanel with TripMapDisplay */}
      </div>

      {/* Chat window with slide-in animation */}
      <div
        className={`
          absolute inset-0 z-50 
          transition-transform duration-300 ease-in-out
          transform ${isChatOpen ? "translate-x-0" : "-translate-x-full"}
          ${isChatOpen ? "pointer-events-auto" : "pointer-events-none"} 
        `}
      >
        <div className="w-full h-full bg-white">
          <ChatWindow
            onClose={toggleChatWindow}
            onApplySuggestion={handleApplySuggestion}
          />
        </div>
      </div>
    </div>
  );
}
