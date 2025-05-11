import React, { useState, useEffect } from "react";
import { updateTripDate } from "../util/updateTripDate.js";
import { updateTripItinerary } from "../util/updateTripItinerary.js";
import apiClient from "../util/api.js";

const AppContext = React.createContext({
  tripData: null,
  updateTrip: () => {},
  fetchTrip: () => {},
  updateItinerary: () => {},
  deleteTripItem: () => {},
  user: null,
  loginUser: () => {},
  logoutUser: () => {},
});

// test dummy data (can be removed if not needed for initial state)
const testTripData = [
  {
    date: "2025-10-01",
    index: 0,
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
    index: 1,
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
  const [tripData, setTripData] = useState(() => {
    try {
      // const saved = localStorage.getItem('tripData');
      // return saved ? JSON.parse(saved) : testTripData;
      return testTripData; //testing
    } catch (e) {
      console.error("Failed to load localStorage tripData:", e);
      return testTripData;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Failed to load user from localStorage:", e);
      return null;
    }
  });

  useEffect(() => {
    if (tripData) {
      localStorage.setItem("tripData", JSON.stringify(tripData));
    }
  }, [tripData]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // Initial check for active session if not found in localStorage
  useEffect(() => {
    const checkUserSession = async () => {
      if (!user) {
        // Only check if user is not already loaded from localStorage
        try {
          console.log(
            "AppContext: No user in localStorage, checking API for session..."
          );
          const response = await apiClient.get("/api/user", {
            withCredentials: true,
          });
          if (response.data) {
            console.log(
              "AppContext: User session found via API, logging in:",
              response.data
            );
            loginUser(response.data);
          }
        } catch (error) {
          if (error.response && error.response.status === 401) {
            // Expected: No active session or cookie is invalid/expired
            console.log("AppContext: No active API session found (401).");
          } else {
            // Other errors (network, server issue)
            console.error("AppContext: Error checking user session:", error);
          }
          // Ensure user is null if API check fails or returns no data
          // setUser(null); // Handled by loginUser if data, or remains null if error
        }
      }
    };

    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this runs once on mount. 'user' is intentionally omitted to prevent re-running on user state changes.

  useEffect(() => {
    if (tripData) {
      localStorage.setItem("tripData", JSON.stringify(tripData));
    }
  }, [tripData]);

  function updateTrip(newRangeTripData) {
    const extendedTrip = updateTripDate(newRangeTripData);
    setTripData(extendedTrip);
  }

  function updateItinerary(currentTripData, updateItem) {
    const newTripData = updateTripItinerary(currentTripData, updateItem);
    setTripData(newTripData);
  }

  function deleteTripItem(deleteTripDay, deleteItem) {
    const newTripData = tripData.map((day) => {
      if (day.date === deleteTripDay.date) {
        return {
          ...day,
          itinerary: day.itinerary.filter(
            (item) =>
              !(
                item.gpPlaceId === deleteItem.gpPlaceId &&
                item.order === deleteItem.order
              )
          ),
        };
      }
      return day;
    });
    setTripData(newTripData);
  }

  function loginUser(userData) {
    setUser(userData);
  }

  function logoutUser() {
    setUser(null);
  }

  const context = {
    tripData,
    updateTrip,
    updateItinerary,
    deleteTripItem,
    user,
    loginUser,
    logoutUser,
  };

  return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
}

export { AppContext, AppContextProvider };
