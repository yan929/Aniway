import React from "react";
import GMap from "./GMap"; // adjust path if needed

const GMAPLocation = ({ baseLocations, focusOnLocation }) => {
  // In a real app, you might use focusOnLocation to pan/zoom the map
  // For now, it's a placeholder for future functionality
  if (focusOnLocation) {
    console.log("Focusing on location:", focusOnLocation);
  }

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <GMap locations={baseLocations} />
    </div>
  );
};

export default GMAPLocation;
