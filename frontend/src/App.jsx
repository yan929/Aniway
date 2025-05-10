import React from "react";
import { Route, Routes } from "react-router-dom";
import { LoadScript } from "@react-google-maps/api";

import HomePage from "./pages/Home/HomePage";
import TripPlanner from "./pages/TripPlanner/TripPlanner";
import LocationsSearchPage from "./pages/Locations/LocationsSearchPage";
import AniDetail from "./pages/AniInfo/AniInfo";
import GMapDemo from "./components/GMap/GMapDemo";
import "./App.css";

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error(
      "Google Maps API key is missing. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file."
    );
    // Optionally render an error message or fallback UI
    return <div>Error: Google Maps API Key is not configured.</div>;
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={["places"]}>
      <Routes>
        {/* Follow route just for temporary */}
        <Route path="/" element={<HomePage />} />
        <Route path="/tripplanner" element={<TripPlanner />} />
        <Route path="/locations/search" element={<LocationsSearchPage />} />
        <Route path="/anime/:id" element={<AniDetail />} />
        {/*
          Temporarily disabled the following routes while focusing on TripPlanner.
          - HomePage: planned for homepage in future
          - /planner: planned dedicated route for trip planner
        */}

        {/* <Route path="/" element={<HomePage />} /> */}
        {/* <Route path="/planner" element={<TripPlanner />} /> */}
      </Routes>
    </LoadScript>
  );
}

export default App;
