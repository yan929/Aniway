import React from "react";
import { Route, Routes } from "react-router-dom";
import { LoadScript } from "@react-google-maps/api";
import HomePage from "./pages/Home/HomePage";
import TripPlanner from "./pages/TripPlanner/TripPlanner";
import LocationsSearchPage from "./pages/Locations/LocationsSearchPage";
import AniDetail from "./pages/AniInfo/AniInfo";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Setting from "./pages/Setting/Setting";
import ProfilePage from "./pages/Profile/ProfilePage";
import LoginPage from "./pages/Login/Login";
import MainLayout from "./components/Layout/MainLayout";

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
      <DndProvider backend={HTML5Backend}>
        <Routes>
          {/* Routes that should have NavBar and Footer, wrapped by MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/tripplanner" element={<TripPlanner />} />
            <Route path="/locations/search" element={<LocationsSearchPage />} />
            <Route path="/anime/:id" element={<AniDetail />} />
            <Route path="/setting" element={<Setting />} />
            <Route path="/create-trip" element={<TripPlanner />} />
            <Route path="/trip/:tripId" element={<TripPlanner />} />
          </Route>

          {/* Routes without NavBar and Footer (e.g., LoginPage) */}
          <Route path="/login" element={<LoginPage />} />

          {/*
          Temporarily disabled the following routes while focusing on TripPlanner.
          - HomePage: planned for homepage in future
          - /planner: planned dedicated route for trip planner
        */}
          {/* <Route path="/" element={<HomePage />} /> */}
          {/* <Route path="/planner" element={<TripPlanner />} /> */}
        </Routes>
      </DndProvider>
    </LoadScript>
  );
}

export default App;
