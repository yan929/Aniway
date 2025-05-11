import React, { useState, useEffect } from "react";
import { updateTripDate } from "../util/updateTripDate.js";
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
  selectedDay: null, // Added for location search functionality
  selectDay: () => {}, // Added for location search functionality
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
      return testTripData; // testing
    } catch (e) {
      console.error("Failed to load localStorage tripData:", e);
      return testTripData;
    }
  });

  // Added selectedDay state for location search functionality
  const [selectedDay, setSelectedDay] = useState(null);

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Failed to load user from localStorage:", e);
      return null;
    }
  });

  // Set default selected day on initial load
  useEffect(() => {
    if (tripData && tripData.length > 0 && !selectedDay) {
      console.log("Initially setting selected day to:", tripData[0]);
      setSelectedDay(tripData[0]);
    }
  }, [tripData, selectedDay]);

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
        }
      }
    };

    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this runs once on mount

  function updateTrip(newRangeTripData) {
    console.log("Updating trip with new range data:", newRangeTripData);
    const extendedTrip = updateTripDate(newRangeTripData);
    setTripData(extendedTrip);
  }

  function updateItinerary(currentTripData, updateItem) {
    console.log("Updating itinerary with item:", updateItem);

    // Ensure we have valid data
    if (
      !currentTripData ||
      !Array.isArray(currentTripData) ||
      !updateItem ||
      !updateItem.date
    ) {
      console.error("Invalid data for updateItinerary:", {
        currentTripData,
        updateItem,
      });
      return;
    }

    try {
      // Create a direct copy to avoid reference issues
      const newTripData = JSON.parse(JSON.stringify(currentTripData));

      // Find the day to update
      const dayIndex = newTripData.findIndex(
        (day) => day.date === updateItem.date
      );

      if (dayIndex === -1) {
        console.error("Day not found in tripData:", updateItem.date);
        return;
      }

      // Ensure itinerary array exists
      if (!newTripData[dayIndex].itinerary) {
        newTripData[dayIndex].itinerary = [];
      }

      // Create a new item with all necessary fields
      const newItem = {
        gpPlaceId: updateItem.gpPlaceId,
        order: updateItem.order || newTripData[dayIndex].itinerary.length,
        arrivalTime: updateItem.arrivalTime || "12:00", // Default value
        note: updateItem.note || "",
      };

      // Add the new item
      newTripData[dayIndex].itinerary.push(newItem);

      console.log("Updated trip data:", newTripData);
      setTripData(newTripData);

      // Update the selected day if it's the same day we're adding to
      if (selectedDay && selectedDay.date === updateItem.date) {
        const updatedSelectedDay = newTripData[dayIndex];
        console.log("Updating selected day:", updatedSelectedDay);
        setSelectedDay(updatedSelectedDay);
      }

      return newTripData;
    } catch (error) {
      console.error("Error in updateItinerary:", error);
    }
  }

  function deleteTripItem(deleteTripDay, deleteItem) {
    console.log("Deleting trip item:", { deleteTripDay, deleteItem });

    try {
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

      console.log("After deletion:", newTripData);
      setTripData(newTripData);

      // If we're deleting from the currently selected day, also update selectedDay
      if (selectedDay && selectedDay.date === deleteTripDay.date) {
        const updatedSelectedDay = newTripData.find(
          (day) => day.date === selectedDay.date
        );
        if (updatedSelectedDay) {
          console.log(
            "Updating selected day after deletion:",
            updatedSelectedDay
          );
          setSelectedDay(updatedSelectedDay);
        }
      }
    } catch (error) {
      console.error("Error in deleteTripItem:", error);
    }
  }

  // Added function to select a specific day
  function selectDay(day) {
    console.log("Selecting day:", day);
    setSelectedDay(day);
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
    selectedDay, // Added for location search functionality
    selectDay, // Added for location search functionality
  };

  return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
}

export { AppContext, AppContextProvider };
