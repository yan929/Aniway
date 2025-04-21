import React from "react";
import { Route, Routes } from "react-router-dom";

import HomePage from "./pages/Home/HomePage";
import TripPlanner from "./pages/TripPlanner/TripPlanner";
import "./App.css";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<TripPlanner />} />
        <Route path="/home" element={<HomePage />} />

        {/*
          Temporarily disabled the following routes while focusing on TripPlanner.
          - HomePage: planned for homepage in future
          - /planner: planned dedicated route for trip planner
        */}
        {/* <Route path="/" element={<HomePage />} /> */}
        {/* <Route path="/planner" element={<TripPlanner />} /> */}
      </Routes>
    </>
  );
}

export default App;
