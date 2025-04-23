import React, { use } from "react";
import Sidebar from "../../components/Tripplanner/Sidebar";
import TripHeader from "../../components/Tripplanner/TripHeader";
import ItinerarySection from "../../components/Tripplanner/ItinerarySection";

// import DaySection from './components/DaySection';
// import MapPanel from './components/MapPanel';

export default function ItineraryPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-100">
        <TripHeader />
        <ItinerarySection />
      </main>
      {/* <MapPanel /> */}
    </div>
  );
}
