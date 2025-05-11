import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/TripPlanner/Sidebar.jsx";
import TripHeader from "../../components/TripPlanner/TripHeader.jsx";
import ItinerarySection from "../../components/TripPlanner/ItinerarySection.jsx";
import ChatWindow from "../../components/AIChat/ChatWindow.jsx";
import { AppContext } from "../../context/AppContext.jsx";

export default function TripPlanner() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { tripData, tripTitle, tripLocation } = useContext(AppContext);
  const navigate = useNavigate();

  // Check if trip data exists when component mounts
  useEffect(() => {
    // If tripData or tripLocation is missing, you might want to redirect or show a message
    if (!tripData || !tripLocation) {
      console.warn("Missing trip data or location. Consider selecting destination and dates from the homepage.");
      
      // Optional: Uncomment to redirect back to homepage if no data
      // navigate('/');
    }
  }, [tripData, tripLocation, navigate]);

  // Toggle chat window visibility
  const toggleChatWindow = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Handle suggestions from the AI chat
  const handleApplySuggestion = (suggestion) => {
    console.log("Applying suggestion to trip plan:", suggestion);
    // Implement suggestion application logic here
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      <Sidebar onToggleChat={toggleChatWindow} />
      <main className="flex-1 overflow-y-auto bg-gray-100">
        <TripHeader />
        <ItinerarySection />
      </main>
      {/* <MapPanel /> */}

      {/* Chat window with slide-in animation */}
      <div
        className={`
          absolute inset-0 z-50 
          transition-transform duration-300 ease-in-out
          transform ${isChatOpen ? "translate-x-0" : "-translate-x-full"}
          ${isChatOpen ? "pointer-events-auto" : "pointer-events-none"} 
        `}
      >
        <div className="w-full h-full bg-white shadow-xl">
          <ChatWindow
            onClose={toggleChatWindow}
            onApplySuggestion={handleApplySuggestion}
          />
        </div>
      </div>
    </div>
  );
}
