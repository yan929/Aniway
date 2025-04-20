import React, { useEffect, useState } from "react";
import GMap from "./GMap"; // adjust path if needed

// Simulate fetching or updating locations
const fetchLocations = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { lat: 35.658581, lng: 139.745438, label: "Tokyo Tower" },
        { lat: 35.6762, lng: 139.6503, label: "Chiyoda" },
      ]);
    }, 2000);
  });
};

const DynamicMapDemo = ({ selectedLocation }) => {
  const [locations, setLocations] = useState([
    { lat: 35.652832, lng: 139.839478, label: "Initial Location" },
  ]);

  useEffect(() => {
    // Simulate data update after 2 seconds
    fetchLocations().then((newLocations) => {
      setLocations(newLocations);
    });
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      setLocations((prev) => [...prev, selectedLocation]);
    }
  }, [selectedLocation]);

  const addLocation = () => {
    setLocations((prev) => [
      ...prev,
      {
        lat: 35.710063,
        lng: 139.8107,
        label: "New Spot: Asakusa",
      },
    ]);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Dynamic GMap</h2>
      <button
        onClick={addLocation}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Add Location
      </button>
      <GMap locations={locations} />
    </div>
  );
};

export default DynamicMapDemo;
