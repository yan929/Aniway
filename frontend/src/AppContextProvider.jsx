import React, { useState, useEffect } from "react";
import { updateTripDate } from "./util/updateTripDate.js";
import { updateTripItinerary } from "./util/updateTripItinerary.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const AppContext = React.createContext({
  tripData: null,
  loading: false,
  updateTrip: () => { },
  fetchTrip: () => { },
  updateItinerary: () => { },
});

// test data
const testTripData = [
  {
    date: "2025-10-01",
    index: 9,
    itinerary: [
      {
        gpPlaceId: "ChIJXSModoWLGGARILWiCfeu2M0",
        order: 1,
        arrivalTime: "12:00",
        note: "Dinner with view",
      },
      {
        gpPlaceId: "ChIJCewJkL2LGGAR3Qmk0vCTGkg",
        order: 2,
        arrivalTime: "22:00",
        note: "Dinner with view",
      },
    ],
  },
  {
    date: "2025-10-02",
    index: 20,
    itinerary: [
      {
        gpPlaceId: "ChIJCewJkL2LGGAR3Qmk0vCTGkg",
        order: 1,
        arrivalTime: "10:00",
        note: "Dinner with view",
      },
    ],
  },
  {
    date: "2025-10-03",
    index: 2,
    itinerary: [
      {
        gpPlaceId: "ChIJCewJkL2LGGAR3Qmk0vCTGkg",
        order: 1,
        arrivalTime: "10:00",
        note: "Dinner with view",
      },
    ],
  },
];

function AppContextProvider({ children }) {
  //initial trip data
  const [tripData, setTripData] = useState(() => {
    try {
      //   const saved = localStorage.getItem('tripData');
      //   return saved ? JSON.parse(saved) : testTripData;
      return testTripData; //testing
    } catch (e) {
      console.error("Failed to load localStorage tripData:", e);
      return testTripData;
    }
  });

  const [loading, setLoading] = useState(false);

  //synchronize trip data to local storage
  useEffect(() => {
    if (tripData) {
      //save new data
      localStorage.setItem("tripData", JSON.stringify(tripData));
      // console.log("locolStorage tripData:", localStorage.getItem('tripData'));
    }
  }, [tripData]);
  //synchronize trip data to local storage
  useEffect(() => {
    if (tripData) {
      //save new data
      localStorage.setItem("tripData", JSON.stringify(tripData));
      // console.log("locolStorage tripData:", localStorage.getItem('tripData'));
    }
  }, [tripData]);

  function updateTrip(newRangeTripData) {
    const extendedTrip = updateTripDate(newRangeTripData);
    //setTripData will update the trip data
    setTripData(extendedTrip);
  }

  function updateItinerary(tripData, updateItem) {
    const newTripData = updateTripItinerary(tripData, updateItem);
    setTripData(newTripData);
    console.log("tripData 99:", tripData);
  }

  const context = {
    tripData,
    loading,
    updateTrip,
    updateItinerary,
  };

  return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
  return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
}

export { AppContext, AppContextProvider };
