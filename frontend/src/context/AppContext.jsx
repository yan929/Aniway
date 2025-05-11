import React, { useState, useEffect, useCallback } from "react";
import { updateTripDate } from "../util/updateTripDate.js";
import apiClient from "../util/api.js";

const AppContext = React.createContext({
  currentTrip: null,
  loadCurrentTrip: async () => {},
  // eslint-disable-next-line no-unused-vars
  updateCurrentTripDetails: (_details) => {},
  saveCurrentTripToDb: async () => {},
  updateTrip: () => {},
  fetchTrip: () => {},
  updateItinerary: () => {},
  deleteTripItem: () => {},
  user: null,
  loginUser: () => {},
  logoutUser: () => {},
  selectedDay: null,
  selectDay: () => {},
  isAuthenticated: false,
  isAuthLoading: true,
  tripTitle: "",
  tripLocation: null,
  setTripDetails: () => {},
});

const initialTestTrip = {
  _id: "681013239a49bb4d4b06de53",
  title: "My Amazing Test Trip",
  content: [
    {
      date: "2025-10-01",
      index: 0,
      itinerary: [
        {
          gpPlaceId: "ChIJCewJkL2LGGAR3Qmk0vCTGkg",
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
  ],
};

function AppContextProvider({ children }) {
  const [currentTrip, setCurrentTrip] = useState(() => {
    try {
      const savedTrip = localStorage.getItem("currentTrip");
      return savedTrip ? JSON.parse(savedTrip) : initialTestTrip;
    } catch (e) {
      console.error("Failed to load currentTrip from localStorage:", e);
      return initialTestTrip;
    }
  });

  // Added for destination and trip details from HomePage
  const [tripTitle, setTripTitle] = useState(() => {
    try {
      const saved = localStorage.getItem("tripTitle");
      return saved || "My Trip";
    } catch (e) {
      console.error("Failed to load localStorage tripTitle:", e);
      return "My Trip";
    }
  });

  // Store the selected destination location
  const [tripLocation, setTripLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("tripLocation");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to load localStorage tripLocation:", e);
      return null;
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

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    if (currentTrip && currentTrip.content.length > 0 && !selectedDay) {
      console.log("Initially setting selected day to:", currentTrip.content[0]);
      setSelectedDay(currentTrip.content[0]);
    }
  }, [currentTrip, selectedDay]);

  // Synchronize trip data to local storage
  useEffect(() => {
    if (currentTrip) {
      localStorage.setItem("currentTrip", JSON.stringify(currentTrip));
    }
  }, [currentTrip]);

  // Synchronize trip title and location to local storage
  useEffect(() => {
    localStorage.setItem("tripTitle", tripTitle);
  }, [tripTitle]);

  useEffect(() => {
    if (tripLocation) {
      localStorage.setItem("tripLocation", JSON.stringify(tripLocation));
    }
  }, [tripLocation]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        console.log("AppContext: Checking API for session...");
        const response = await apiClient.get("/api/user", {
          withCredentials: true,
        });
        if (response.data) {
          console.log(
            "AppContext: User session found via API, logging in:",
            response.data
          );
          setUser(response.data);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
        if (error.response && error.response.status === 401) {
          console.log("AppContext: No active API session found (401).");
        } else {
          console.error("AppContext: Error checking user session:", error);
        }
      }
      setIsAuthLoading(false);
    };

    checkUserSession();
  }, []);

  const updateCurrentTripDetails = useCallback((detailsToUpdate) => {
    setCurrentTrip((prevTrip) => {
      if (!prevTrip) {
        console.warn(
          "updateCurrentTripDetails called when prevTrip is null. detailsToUpdate:",
          detailsToUpdate
        );
        return { ...prevTrip, ...detailsToUpdate };
      }
      return { ...prevTrip, ...detailsToUpdate };
    });
    console.log("AppContext: Local currentTrip updated with:", detailsToUpdate);
  }, []);

  const saveCurrentTripToDb = useCallback(async () => {
    if (!currentTrip) {
      console.error("saveCurrentTripToDb: No currentTrip to save.");
      alert("No trip data to save.");
      return;
    }

    const { _id, title, content } = currentTrip;
    const payload = { title, content };

    if (!_id) {
      console.log("AppContext: Creating new trip with payload:", payload);
      try {
        const response = await apiClient.post("/api/tplan", payload);
        setCurrentTrip(response.data);
        console.log(
          "AppContext: New trip created successfully.",
          response.data
        );
        alert("Trip created and saved successfully!");
      } catch (error) {
        console.error(
          "AppContext: Error creating new trip:",
          error.response ? error.response.data : error.message
        );
        alert(
          "Error creating trip. " +
            (error.response?.data?.message || error.message)
        );
        throw error;
      }
    } else {
      console.log(
        `AppContext: Updating existing trip ${_id} with payload:`,
        payload
      );
      try {
        const response = await apiClient.patch(`/api/tplan/${_id}`, payload);
        setCurrentTrip((prevTrip) => ({ ...prevTrip, ...response.data }));
        console.log("AppContext: Trip updated successfully.", response.data);
        alert("Trip updated successfully!");
      } catch (error) {
        console.error(
          `AppContext: Error updating trip ${_id}:`,
          error.response ? error.response.data : error.message
        );
        alert(
          "Error updating trip. " +
            (error.response?.data?.message || error.message)
        );
        throw error;
      }
    }
  }, [currentTrip, setCurrentTrip]);

  const updateTrip = useCallback(
    (newDayPlanArray) => {
      if (!currentTrip) {
        console.warn(
          "AppContext: Cannot update trip content, currentTrip is null."
        );
        return;
      }
      console.log("Updating trip with new range data:", newDayPlanArray);
      const extendedContent = updateTripDate(newDayPlanArray);
      updateCurrentTripDetails({ content: extendedContent });
    },
    [currentTrip, updateCurrentTripDetails]
  );

  // Refactored function to update itinerary for a specific day
  function updateItinerary(dayDate, newItemsArray) {
    console.log(
      `Updating itinerary for date: ${dayDate} with items:`,
      newItemsArray
    );

    if (!currentTrip || !currentTrip.content) {
      console.error(
        "AppContext: currentTrip is not initialized, cannot update itinerary.",
        { currentTrip }
      );
      // Optionally, initialize to initialTestTrip if it's a desired fallback here
      // setCurrentTrip(initialTestTrip);
      // console.log("AppContext: Initialized currentTrip with initialTestTrip.");
      // return; // Or proceed if initialized
      return;
    }

    if (!dayDate || !Array.isArray(newItemsArray)) {
      console.error("Invalid arguments for updateItinerary:", {
        dayDate,
        newItemsArray,
      });
      return;
    }

    try {
      const updatedContent = currentTrip.content.map((day) => {
        if (day.date === dayDate) {
          // Ensure order is maintained if newItemsArray isn't pre-sorted or doesn't have order
          // For now, assuming newItemsArray is the complete, ordered list for the day.
          return { ...day, itinerary: newItemsArray };
        }
        return day;
      });

      const newCurrentTrip = { ...currentTrip, content: updatedContent };
      setCurrentTrip(newCurrentTrip);
      console.log(
        "AppContext: Itinerary updated, new currentTrip:",
        newCurrentTrip
      );

      // If the updated day is the selected day, update selectedDay state
      if (selectedDay && selectedDay.date === dayDate) {
        const updatedSelectedDayObject = updatedContent.find(
          (day) => day.date === dayDate
        );
        if (updatedSelectedDayObject) {
          setSelectedDay(updatedSelectedDayObject);
          console.log(
            "AppContext: Selected day was updated:",
            updatedSelectedDayObject
          );
        }
      }
    } catch (error) {
      console.error("AppContext: Error in updateItinerary:", error);
    }
  }

  function deleteTripItem(deleteTripDay, deleteItem) {
    console.log("Deleting trip item:", { deleteTripDay, deleteItem });

    try {
      const newTripData = currentTrip.content.map((day) => {
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
      updateCurrentTripDetails({ content: newTripData });

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

  // Function to set trip details from HomePage
  function setTripDetails(location, title, dates) {
    console.log("Setting trip details:", { location, title, dates });

    // Update location and title
    if (location) setTripLocation(location);
    if (title) setTripTitle(title);

    // If dates are provided, update the trip data
    if (dates && dates.start && dates.end) {
      // Create date range from the selected dates
      const startDate = new Date(dates.start);
      const endDate = new Date(dates.end);

      // Format dates to YYYY-MM-DD
      const formatDate = (date) => {
        return date.toISOString().split("T")[0];
      };

      // Generate array of dates
      const dateArray = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        dateArray.push({
          date: formatDate(currentDate),
          index: dateArray.length,
          itinerary: [],
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Update trip with new date range
      if (dateArray.length > 0) {
        updateTrip(dateArray);
      }
    }
  }

  // Added function to select a specific day
  function selectDay(day) {
    console.log("Selecting day:", day);
    setSelectedDay(day);
  }

  const loadCurrentTrip = useCallback(async (tripId) => {
    if (!tripId) {
      console.log(
        "AppContext: No tripId provided, cannot load trip. Setting to null or initial."
      );
      return;
    }
    try {
      console.log(`AppContext: Loading trip with ID: ${tripId}`);
      const response = await apiClient.get(`/api/tplan/${tripId}`);
      if (response.data) {
        setCurrentTrip(response.data);
        console.log("AppContext: Trip loaded successfully:", response.data);
      } else {
        console.warn(`AppContext: No data returned for trip ID ${tripId}.`);
      }
    } catch (error) {
      console.error(`AppContext: Error loading trip ${tripId}:`, error);
    }
  }, []);

  const loginUser = useCallback((userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    console.log("AppContext: User logged in, isAuthenticated set to true.");
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
      console.log("AppContext: Logout successful on backend.");
    } catch (error) {
      console.error("AppContext: Error during backend logout:", error);
      // Still proceed with frontend logout
    }
    setUser(null);
    setIsAuthenticated(false);
    setSelectedDay(null);
    console.log("AppContext: User logged out, isAuthenticated set to false.");
  }, []);

  const context = {
    currentTrip,
    loadCurrentTrip,
    updateCurrentTripDetails,
    saveCurrentTripToDb,
    updateTrip,
    updateItinerary,
    deleteTripItem,
    selectedDay,
    selectDay,
    user,
    loginUser,
    logoutUser,
    tripTitle,
    tripLocation,
    setTripDetails,
    isAuthenticated,
    isAuthLoading,
  };

  return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
}

export { AppContext, AppContextProvider };
