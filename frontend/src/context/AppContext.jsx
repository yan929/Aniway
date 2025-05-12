import React, { useState, useEffect, useCallback, useContext } from "react";
import { updateTripDate } from "../util/updateTripDate.js";
import apiClient from "../util/api.js";
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrBefore);

const AppContext = React.createContext({
  currentTrip: null,
  loadCurrentTrip: async () => { },
  // eslint-disable-next-line no-unused-vars
  appendItemsToContent: (itemsArray) => { },
  // eslint-disable-next-line no-unused-vars
  replaceEntireTrip: (newTripObject) => { },
  // eslint-disable-next-line no-unused-vars
  updateCurrentTripTitle: (newTitle) => { },
  saveCurrentTripToDb: async () => { },
  updateTrip: () => { },
  fetchTrip: () => { },
  updateItinerary: () => { },
  deleteTripItem: () => { },
  user: null,
  loginUser: () => { },
  logoutUser: () => { },
  selectedDay: null,
  selectDay: () => { },
  isAuthenticated: false,
  isAuthLoading: true,
  tripTitle: "",
  tripLocation: null,
  setTripDetails: () => { },
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

  // Renamed and repurposed from appendDataToTrip
  const appendItemsToContent = useCallback((itemsToAppend) => {
    if (!Array.isArray(itemsToAppend)) {
      console.error(
        "appendItemsToContent expects an array, received:",
        itemsToAppend
      );
      return;
    }
    setCurrentTrip((prevTrip) => {
      if (!prevTrip) {
        console.warn(
          "appendItemsToContent called when prevTrip is null. Initializing with new content."
        );
        return { content: itemsToAppend }; // Or some other default structure if needed
      }
      return {
        ...prevTrip,
        content: [...(prevTrip.content || []), ...itemsToAppend],
      };
    });
    console.log(
      "AppContext: Appended items to currentTrip.content:",
      itemsToAppend
    );
  }, []);

  // New function to replace the entire trip object
  const replaceEntireTrip = useCallback((newTripObject) => {
    setCurrentTrip(newTripObject);
    console.log("AppContext: Replaced entire currentTrip with:", newTripObject);
  }, []);

  // Function to update only the trip title
  const updateCurrentTripTitle = useCallback(
    (newTitle) => {
      setCurrentTrip((prevTrip) => {
        if (!prevTrip) {
          // This case should ideally be prevented by UI logic (e.g., in TripHeader)
          console.error(
            "updateCurrentTripTitle: currentTrip is null, cannot set title."
          );
          // If a trip must be created, it needs more default fields:
          // return { title: newTitle, content: [], _id: null, /* other initial fields */ };
          return prevTrip; // Or return null/initialTestTrip if appropriate
        }
        return { ...prevTrip, title: newTitle };
      });
      setTripTitle(newTitle); // Update the separate tripTitle state for broader consistency
      console.log(
        "AppContext: currentTrip.title and standalone tripTitle updated to:",
        newTitle
      );
    },
    [setTripTitle]
  ); // setTripTitle from useState is stable

  const saveCurrentTripToDb = useCallback(async () => {
    if (!currentTrip) {
      console.error("saveCurrentTripToDb: No currentTrip to save.");
      alert("No trip data to save.");
      return;
    }

    if (!user || !user.id) {
      console.error(
        "saveCurrentTripToDb: User not logged in or user.id is missing. User object was:",
        JSON.stringify(user, null, 2)
      );
      alert("You must be logged in to save a trip.");
      return;
    }

    console.log(" ---> Save currentTrip", currentTrip);
    const { _id, title, content, image } = currentTrip;
    // Add userId to the payload, using user.id as per the logged object structure
    const payload = {
      title,
      content,
      image,
      userId: user.id,
    };

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
  }, [currentTrip, setCurrentTrip, user]);

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
      // updateTrip now uses replaceEntireTrip to set the new content within the existing trip structure
      if (currentTrip) {
        // Ensure currentTrip exists before spreading
        replaceEntireTrip({ ...currentTrip, content: extendedContent });
      } else {
        console.warn(
          "updateTrip: currentTrip is null, cannot create new trip structure with content only."
        );
        // Potentially set to a new trip with just this content if that's desired:
        // replaceEntireTrip({ title: 'New Trip', content: extendedContent, _id: null /* etc */ });
      }
    },
    [currentTrip, replaceEntireTrip] // Dependency updated
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
      // deleteTripItem now uses replaceEntireTrip
      if (currentTrip) {
        // Ensure currentTrip exists
        replaceEntireTrip({ ...currentTrip, content: newTripData });
      } else {
        console.warn("deleteTripItem: currentTrip is null.");
      }

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

    // Explicitly check properties and log them
    const hasStartDate = dates && dates.hasOwnProperty('startDate') && dates.startDate instanceof Date;
    const hasEndDate = dates && dates.hasOwnProperty('endDate') && dates.endDate instanceof Date;
    const isStartBeforeEnd = hasStartDate && hasEndDate && dates.startDate <= dates.endDate;

    // --- Debugging End ---


    // Update separate location/title states if they are used elsewhere independently
    if (location) setTripLocation(location);
    if (title) setTripTitle(title); // Keep this if tripTitle state is used directly

    let newContent = [];
    // If dates are valid, generate the content array using dayjs
    if (dates && hasStartDate && hasEndDate && isStartBeforeEnd) {
      console.log("[setTripDetails] Date check passed. Generating content with dayjs...");

      // Convert start and end dates to dayjs objects
      let currentDay = dayjs(dates.startDate).startOf('day');
      const endDay = dayjs(dates.endDate).startOf('day');

      // Iterate using dayjs isSameOrBefore and add methods
      while (currentDay.isSameOrBefore(endDay)) {
        newContent.push({
          date: currentDay.format('YYYY-MM-DD'), // Format using dayjs
          index: newContent.length,
          itinerary: [],
        });
        // Move to the next day
        currentDay = currentDay.add(1, 'day');
      }
      console.log("[setTripDetails] Generated content:", newContent);

    } else {
      console.warn("[setTripDetails] Date check failed. Content will be empty.", {
        receivedDates: dates,
        check_hasStartDate: hasStartDate,
        check_hasEndDate: hasEndDate,
        check_isStartBeforeEnd: isStartBeforeEnd
      });
    }

    // Update the entire currentTrip state object AT ONCE
    setCurrentTrip((prevTrip) => {
      const tripId = prevTrip?._id; // Preserve existing ID if any
      const newTrip = {
        ...prevTrip,             // Preserve other fields like image, userId etc.
        _id: tripId,
        title: title || "My Trip", // Set title directly in currentTrip
        content: newContent,       // Set content directly in currentTrip
        // You might want to store the primary destination location here too:
        // destination: location || prevTrip?.destination,
      };
      console.log("Setting new currentTrip context:", newTrip);
      // LocalStorage update is handled by the useEffect hook watching currentTrip
      return newTrip;
    });

    // Reset selected day based on the new content
    if (newContent.length > 0) {
      setSelectedDay(newContent[0]); // Select the first day
      console.log("Resetting selectedDay to:", newContent[0]);
    } else {
      setSelectedDay(null); // Clear selected day if no content generated
      console.log("Resetting selectedDay to null as content is empty.");
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

  const updateUser = useCallback((updatedUserData) => {
    setUser(updatedUserData);
    setIsAuthenticated(true);
    console.log("AppContext: User update with new name.");
  }, []);


  const context = {
    currentTrip,
    loadCurrentTrip,
    appendItemsToContent,
    replaceEntireTrip,
    updateCurrentTripTitle,
    saveCurrentTripToDb,
    updateTrip,
    updateItinerary,
    deleteTripItem,
    selectedDay,
    selectDay,
    user,
    loginUser,
    logoutUser,
    updateUser,
    tripTitle,
    tripLocation,
    setTripDetails,
    isAuthenticated,
    isAuthLoading,
  };

  return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
}

export { AppContext, AppContextProvider };
