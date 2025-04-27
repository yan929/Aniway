import React, { useState } from "react";
import Sidebar from "../../components/TripPlanner/Sidebar.jsx";
import TripHeader from "../../components/TripPlanner/TripHeader.jsx";
import ItinerarySection from "../../components/TripPlanner/ItinerarySection.jsx";
import ChatWindow from "../../components/AIChat/ChatWindow.jsx";

// import DaySection from './components/DaySection';
// import MapPanel from './components/MapPanel';

export default function ItineraryPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChatWindow = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      <Sidebar onToggleChat={toggleChatWindow} />
      <main className="flex-1 overflow-y-auto bg-gray-100">
        <TripHeader />
        <ItinerarySection />
      </main>
      {/* <MapPanel /> */}

      <div
        className={`
          absolute inset-0 z-50 
          transition-transform duration-300 ease-in-out
          transform ${isChatOpen ? "translate-x-0" : "-translate-x-full"}
          ${isChatOpen ? "pointer-events-auto" : "pointer-events-none"} 
        `}
      >
        {/* Render ChatWindow inside the fixed container, maybe give it a width */}
        <div className="w-full h-full bg-white shadow-xl">
          <ChatWindow
            onClose={toggleChatWindow}
            onApplySuggestion={(suggestion) => {
              console.log("Applying suggestion:", suggestion);
              /* Define actual handler later */
            }}
          />
        </div>
      </div>
    </div>
  );
}
