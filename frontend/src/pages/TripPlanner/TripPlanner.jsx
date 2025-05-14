import React, {
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../components/TripPlanner/Sidebar.jsx";
import TripHeader from "../../components/TripPlanner/TripHeader.jsx";
import ItinerarySection from "../../components/TripPlanner/ItinerarySection.jsx";
import ChatWindow from "../../components/AIChat/ChatWindow.jsx";
import TripMapDisplay from "../../components/TripPlanner/TripMapDisplay.jsx";
import { AppContext } from "../../context/AppContext.jsx";
import apiClient from "../../util/api.js"; // Added import

export default function TripPlanner() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { currentTrip, tripLocation, replaceEntireTrip, isAuthLoading } =
    useContext(AppContext);
  const location = useLocation(); // Get current location

  // Effect to add/remove class from body based on route
  useEffect(() => {
    const rootElement = document.body; // Target body for class manipulation
    if (location.pathname === "/tripplanner") {
      rootElement.classList.add("root-fullscreen");
    } else {
      rootElement.classList.remove("root-fullscreen");
    }
    // Cleanup function to remove the class if the component unmounts
    // or if the path changes away from /tripplanner before unmount
    return () => {
      rootElement.classList.remove("root-fullscreen");
    };
  }, [location.pathname]); // Re-run effect if location.pathname changes

  // Effect to create a default 'New Trip' if none exists on load for an authenticated user
  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!currentTrip) {
      console.log(
        "TripPlanner: No currentTrip found after auth check, creating default 'New Trip'."
      );
      const defaultNewTrip = {
        title: "New Trip",
        content: [],
      };
      replaceEntireTrip(defaultNewTrip);
    }
  }, [currentTrip, replaceEntireTrip, isAuthLoading]);

  // Ref to store the refs of each day section from ItinerarySection
  const daySectionRefs = useRef({});

  // Callback function for ItinerarySection to pass up its refs
  const handleRefsCreated = (refs) => {
    daySectionRefs.current = refs;
  };

  // Function to scroll to a specific day
  const scrollToDay = useCallback(
    (date) => {
      const ref = daySectionRefs.current[date];
      if (ref) {
        ref.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        console.warn(`Ref for date ${date} not found.`);
      }
    },
    [daySectionRefs]
  );

  // Check if trip data exists when component mounts
  useEffect(() => {
    if (!currentTrip || !tripLocation) {
      console.warn(
        "Missing trip data or location. Consider selecting destination and dates from the homepage."
      );
    }
  }, [currentTrip, tripLocation]);

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
                return null;
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
                  return null;
                }

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
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar onToggleChat={toggleChatWindow} onScrollToDay={scrollToDay} />
      <main
        className="relative z-10 overflow-y-auto bg-gray-100 dark:bg-gray-800 min-h-0 grow-0 min-w-[500px] max-w-[600px]"
        style={{ boxShadow: "6px 0px 5px -3px rgba(0, 0, 0, 0.25)" }}
      >
        {" "}
        <TripHeader />
        <ItinerarySection onRefsCreated={handleRefsCreated} />
      </main>
      <div className="flex-1 bg-gray-200 dark:bg-gray-800 h-full">
        {" "}
        <TripMapDisplay />
      </div>

      {/* Chat window with slide-in animation */}
      {isChatOpen && (
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
      )}
    </div>
  );
}
