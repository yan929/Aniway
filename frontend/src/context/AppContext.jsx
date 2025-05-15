import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../util/api.js";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useNavigate, useLocation } from "react-router-dom";
dayjs.extend(isSameOrBefore);

const AppContext = React.createContext({
  currentTrip: null,
  loadCurrentTrip: async () => { },
  appendItemsToContent: () => { },
  replaceEntireTrip: () => { },
  updateCurrentTripTitle: () => { },
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
  clearCurrentTrip: () => { },
  // For Generic Confirm Modal
  isConfirmModalOpen: false,
  confirmModalConfig: {
    title: "",
    message: "",
    onConfirm: () => { },
    onCancel: () => { },
  },
  // eslint-disable-next-line no-unused-vars
  showConfirmModal: (config) => { },
  hideConfirmModal: () => { },
  // For Success Toast
  isSuccessToastOpen: false,
  successToastMessage: "",
  // eslint-disable-next-line no-unused-vars
  showSuccessToast: (message) => { },
  hideSuccessToast: () => { },
});

function AppContextProvider({ children }) {
  const [currentTrip, setCurrentTrip] = useState(() => {
    try {
      const savedTrip = localStorage.getItem("currentTrip");
      return savedTrip ? JSON.parse(savedTrip) : null;
    } catch (e) {
      console.error("Failed to load currentTrip from localStorage:", e);
      return null;
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

  // State for Generic Confirm Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: "Confirm Action",
    message: "Are you sure?",
    onConfirm: () => { },
    confirmText: "Confirm", // Default confirm button text
    cancelText: "Cancel", // Default cancel button text
  });

  // State for Success Toast
  const [isSuccessToastOpen, setIsSuccessToastOpen] = useState(false);
  const [successToastMessage, setSuccessToastMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // Function to show the confirm modal with specific configuration
  const showConfirmModal = useCallback(
    (config) => {
      setConfirmModalConfig({
        title: config.title || "Confirm Action",
        message: config.message || "Are you sure?",
        onConfirm: config.onConfirm || (() => { }),
        confirmText: config.confirmText || "Confirm",
        cancelText: config.cancelText || "Cancel",
      });
      setIsConfirmModalOpen(true);
    },
    [setIsConfirmModalOpen, setConfirmModalConfig]
  );

  // Function to hide the confirm modal
  const hideConfirmModal = useCallback(() => {
    setIsConfirmModalOpen(false);
  }, [setIsConfirmModalOpen]);

  // Specific handler for login confirmation, to be passed to showConfirmModal
  const handleActualLoginConfirm = useCallback(() => {
    localStorage.setItem(
      "redirectPath",
      location.pathname + location.search + location.hash
    );
    navigate("/login");
    hideConfirmModal(); // Close modal after action
  }, [location, navigate, hideConfirmModal]);

  // Functions for Success Toast
  const showSuccessToast = useCallback(
    (message) => {
      setSuccessToastMessage(message);
      setIsSuccessToastOpen(true);
    },
    [setIsSuccessToastOpen, setSuccessToastMessage]
  );

  const hideSuccessToast = useCallback(() => {
    setIsSuccessToastOpen(false);
  }, [setIsSuccessToastOpen]);

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

          // Handle redirection after setting auth state
          const redirectPath = localStorage.getItem("redirectPath");
          if (redirectPath) {
            console.log(
              "AppContext: Found redirectPath, navigating to:",
              redirectPath
            );
            localStorage.removeItem("redirectPath");
            navigate(redirectPath);
          }
          // If no redirectPath, user stays on the page they were sent to by backend OAuth flow
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
  }, [navigate, setUser, setIsAuthenticated, setIsAuthLoading]);

  const appendItemsToContent = useCallback(
    (itemsToAppend) => {
      if (!currentTrip) {
        console.warn(
          "AppContext: currentTrip is null, cannot append items. Consider initializing."
        );
        return;
      }
      setCurrentTrip((prevTrip) => {
        // Ensure prevTrip and prevTrip.content are valid
        const existingContent = prevTrip?.content || [];
        // Check if itemsToAppend is an array, if not, wrap it in an array or handle error
        const newItems = Array.isArray(itemsToAppend)
          ? itemsToAppend
          : [itemsToAppend];

        // Create a new array for content to ensure immutability
        const updatedContent = [...existingContent, ...newItems];

        return {
          ...prevTrip,
          content: updatedContent,
        };
      });
    },
    [setCurrentTrip, currentTrip] // Added currentTrip to dependency array
  );

  // Added for replacing the entire trip (e.g., with AI suggestion)
  const replaceEntireTrip = useCallback(
    (newTripData) => {
      // Update currentTrip with newTripData
      setCurrentTrip(newTripData);
      // Reset selected day based on new content
      if (newTripData.content && newTripData.content.length > 0) {
        setSelectedDay(newTripData.content[0]);
      } else {
        setSelectedDay(null);
      }
      // Update trip title from newTripData if it exists
      if (newTripData.title) {
        setTripTitle(newTripData.title);
      }
      // Update trip location from newTripData if it exists (assuming structure)
      // if (newTripData.destination) { // Example: you might need to adjust the key
      //   setTripLocation(newTripData.destination);
      // }
    },
    [setCurrentTrip, setSelectedDay, setTripTitle] // setTripLocation can be added if used
  );

  // Added for updating the trip title from TripHeader
  const updateCurrentTripTitle = useCallback(
    (newTitle) => {
      setCurrentTrip((prevTrip) => {
        // If prevTrip is null, this could be an issue. Consider initializing it.
        if (!prevTrip) {
          console.warn(
            "updateCurrentTripTitle: prevTrip is null. Initializing a new trip structure."
          );
          // Initialize with a basic structure if updating title on a non-existent trip
          return { title: newTitle, content: [] }; // Adjust as necessary
        }
        return {
          ...prevTrip,
          title: newTitle,
        };
      });
      setTripTitle(newTitle); // Also update the separate tripTitle state if still used for HomePage
    },
    [setCurrentTrip, setTripTitle] // setTripTitle from useState is stable
  );

  const saveCurrentTripToDb = useCallback(async () => {
    if (!isAuthenticated) {
      console.log("User not authenticated. Prompting for login.");
      showConfirmModal({
        title: "Login Required",
        message:
          "You need to be logged in to save your trip. Would you like to log in now?",
        onConfirm: handleActualLoginConfirm,
        confirmText: "Log In",
        cancelText: "Cancel",
      });
      return;
    }

    if (!currentTrip) {
      console.warn("AppContext: No currentTrip data to save.");
      return;
    }

    try {
      let response;
      if (currentTrip.id) {
        // User changed this from _id
        console.log(`AppContext: Updating existing trip ID: ${currentTrip.id}`);
        response = await apiClient.patch(
          `/api/tplan/${currentTrip.id}`,
          currentTrip,
          { withCredentials: true }
        );
        console.log("AppContext: Trip updated successfully:", response.data);
        showSuccessToast("Trip updated successfully!");
      } else {
        console.log("AppContext: Saving new trip.");
        response = await apiClient.post("/api/tplan", currentTrip, {
          withCredentials: true,
        });
        console.log("AppContext: New trip saved successfully:", response.data);
        setCurrentTrip(response.data);
        showSuccessToast("Trip created successfully!");
      }
    } catch (error) {
      console.error("AppContext: Error saving trip:", error);
      if (error.response && error.response.status === 401) {
        console.log("AppContext: Unauthorized to save. Prompting for login.");
        showConfirmModal({
          title: "Login Required",
          message:
            "Your session may have expired. You need to be logged in to save your trip. Would you like to log in now?",
          onConfirm: handleActualLoginConfirm,
          confirmText: "Log In",
          cancelText: "Cancel",
        });
      }
    }
  }, [
    currentTrip,
    isAuthenticated,
    setCurrentTrip,
    showConfirmModal, // Use generic showConfirmModal
    handleActualLoginConfirm, // Pass the specific confirm handler
    showSuccessToast,
  ]);

  const updateTrip = useCallback(
    // This function updates the entire `content` array of `currentTrip`
    // It's used, for example, when changing dates in TripHeader
    (newDayPlanArray) => {
      if (currentTrip) {
        let newStartDate = currentTrip.startDate; // Preserve by default
        let newEndDate = currentTrip.endDate;   // Preserve by default

        if (newDayPlanArray && newDayPlanArray.length > 0) {
          newStartDate = newDayPlanArray[0].date; // First day's date
          newEndDate = newDayPlanArray[newDayPlanArray.length - 1].date; // Last day's date
        } else {
          // If the array is empty, perhaps dates should be nulled or handled as per app logic
          newStartDate = null;
          newEndDate = null;
        }

        const updatedTrip = {
          ...currentTrip,
          startDate: newStartDate, // Update root startDate
          endDate: newEndDate,   // Update root endDate
          content: newDayPlanArray,
        };
        setCurrentTrip(updatedTrip);

        // If the selected day is no longer in the newDayPlanArray (e.g., date range changed),
        // reset selectedDay to the first day of the new plan, or null if empty.
        const selectedDayStillExists = newDayPlanArray.some(
          (day) => day.date === selectedDay?.date
        );

        if (!selectedDayStillExists) {
          if (newDayPlanArray.length > 0) {
            setSelectedDay(newDayPlanArray[0]);
            console.log(
              "Selected day was outside new range, reset to:",
              newDayPlanArray[0]
            );
          } else {
            setSelectedDay(null);
            console.log(
              "Selected day was outside new range, and new range is empty, reset to null."
            );
          }
        }
      } else {
        console.warn(
          "updateTrip: currentTrip is null, cannot create new trip structure with content only."
        );
      }
    },
    [currentTrip, setCurrentTrip, selectedDay, setSelectedDay] // Added setSelectedDay
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
          return { ...day, itinerary: newItemsArray };
        }
        return day;
      });

      setCurrentTrip((prevTrip) => {
        const newTripState = { ...prevTrip, content: updatedContent };
        // console.log("New trip state after itinerary update:", newTripState);
        return newTripState;
      });

      // If the updated day is the currently selected day, update selectedDay state too
      // to ensure any components observing selectedDay (like SearchBar) get the fresh itinerary.
      if (selectedDay && selectedDay.date === dayDate) {
        setSelectedDay((prevSelectedDay) => ({
          ...prevSelectedDay,
          itinerary: newItemsArray,
        }));
        // console.log(
        //   "Selected day itinerary updated directly in selectedDay state."
        // );
      }
    } catch (error) {
      console.error("Error in updateItinerary:", error);
      // Potentially revert or notify user
    }
  }

  function deleteTripItem(deleteTripDay, deleteItem) {
    console.log("Attempting to delete item:", deleteItem);
    console.log("From day:", deleteTripDay);

    if (!currentTrip) {
      console.error("Cannot delete item: currentTrip is null.");
      return;
    }

    const updatedContent = currentTrip.content.map((day) => {
      if (day.date === deleteTripDay.date) {
        const updatedItinerary = day.itinerary.filter(
          (item) => item.id !== deleteItem.id
        );
        return { ...day, itinerary: updatedItinerary };
      }
      return day;
    });

    setCurrentTrip((prev) => ({ ...prev, content: updatedContent }));

    // If the deleted item was from the selected day, update selectedDay as well
    if (selectedDay && selectedDay.date === deleteTripDay.date) {
      setSelectedDay((prevSelectedDay) => ({
        ...prevSelectedDay,
        itinerary: prevSelectedDay.itinerary.filter(
          (item) => item.id !== deleteItem.id
        ),
      }));
      console.log("Item deleted from selected day, selectedDay state updated.");
    }
  }

  // Function to handle moving an item from one day to another atomically
  function moveItemAcrossDays(
    sourceDayDate,
    targetDayDate,
    itemToMove,
    targetDayCurrentItinerary // Itinerary of the target day BEFORE adding the new item
  ) {
    if (!currentTrip) {
      console.error("Cannot move item: currentTrip is null.");
      return;
    }

    let finalContent = [...currentTrip.content]; // Shallow copy
    let operationSuccess = false;

    // 1. Remove from source day
    const sourceDayIndex = finalContent.findIndex(
      (day) => day.date === sourceDayDate
    );
    if (sourceDayIndex === -1) {
      console.error(`Source day ${sourceDayDate} not found.`);
      return;
    }

    const sourceDay = { ...finalContent[sourceDayIndex] }; // Shallow copy day object
    const itemIndexInSource = sourceDay.itinerary.findIndex(
      (item) => item.id === itemToMove.id
    );

    if (itemIndexInSource === -1) {
      console.warn(
        `Item to move (ID: ${itemToMove.id}) not found in source day ${sourceDayDate}. It might have been already moved or deleted.`
      );
      // This can happen if a move operation is accidentally triggered twice or if the item was removed by another process.
      // Depending on desired behavior, you might stop here or proceed to ensure it's added to the target if that's robust.
      // For now, let's log and potentially proceed to add to target if it's not there.
    } else {
      sourceDay.itinerary = [
        ...sourceDay.itinerary.slice(0, itemIndexInSource),
        ...sourceDay.itinerary.slice(itemIndexInSource + 1),
      ];
      finalContent[sourceDayIndex] = sourceDay;
      operationSuccess = true; // At least removal was attempted/successful
    }

    // 2. Add to target day (using the passed targetDayCurrentItinerary for correct placement)
    const targetDayIndex = finalContent.findIndex(
      (day) => day.date === targetDayDate
    );
    if (targetDayIndex === -1) {
      console.error(`Target day ${targetDayDate} not found.`);
      // If removal was successful, this would be a data inconsistency state.
      // Consider how to handle this - revert removal or log error.
      return; // For now, stop if target day doesn't exist.
    }

    const targetDay = { ...finalContent[targetDayIndex] }; // Shallow copy day object

    // Use the provided targetDayCurrentItinerary which reflects the state *before* this item is added to it by dnd-kit's onDragEnd optimistic update.
    // Then, add the itemToMove to this known state.
    // This avoids duplicates if onDragEnd already optimistically added it to a copy of the target day's itinerary.
    const newTargetItinerary = [...targetDayCurrentItinerary, itemToMove];

    targetDay.itinerary = newTargetItinerary;
    finalContent[targetDayIndex] = targetDay;
    operationSuccess = true;

    if (operationSuccess) {
      setCurrentTrip((prevTrip) => ({ ...prevTrip, content: finalContent }));

      // Update selectedDay if necessary
      if (selectedDay) {
        if (selectedDay.date === sourceDayDate) {
          setSelectedDay(sourceDay);
        }
        if (selectedDay.date === targetDayDate) {
          setSelectedDay(targetDay);
        }
      }
      console.log(
        `Item ${itemToMove.id} moved from ${sourceDayDate} to ${targetDayDate}.`
      );
    } else {
      console.warn("Move operation did not complete successfully.");
    }
  }

  // Function to set trip details from HomePage
  function setTripDetails(location, title, dates) {
    setTripTitle(title || "My Trip"); // Set the separate tripTitle state
    setTripLocation(location); // Set the separate tripLocation state

    console.log("[setTripDetails] Received:", {
      location,
      title,
      dates,
    });

    let newContent = [];
    let newTripStartDate = null; // Initialize for root startDate
    let newTripEndDate = null;   // Initialize for root endDate

    const hasStartDate = dates && dates.startDate;
    const hasEndDate = dates && dates.endDate;
    const isStartBeforeEnd =
      hasStartDate &&
      hasEndDate &&
      dayjs(dates.startDate).isSameOrBefore(dayjs(dates.endDate), "day");

    if (hasStartDate && hasEndDate && isStartBeforeEnd) {
      let currentDay = dayjs(dates.startDate);
      const endDay = dayjs(dates.endDate);

      // Set root start and end dates for the trip object
      newTripStartDate = dayjs(dates.startDate).format("YYYY-MM-DD");
      newTripEndDate = dayjs(dates.endDate).format("YYYY-MM-DD");

      while (currentDay.isSameOrBefore(endDay, "day")) {
        const currentDateStr = currentDay.format("YYYY-MM-DD");
        // Try to find an existing day's itinerary if currentTrip and its content exist
        const existingDayData = currentTrip?.content?.find(
          (d) => d.date === currentDateStr
        );
        newContent.push({
          date: currentDateStr,
          itinerary: existingDayData?.itinerary || [],
        });
        currentDay = currentDay.add(1, "day");
      }
      console.log("[setTripDetails] Generated content:", newContent);
    } else {
      console.warn(
        "[setTripDetails] Date check failed. Content will be empty.",
        {
          receivedDates: dates,
          check_hasStartDate: hasStartDate,
          check_hasEndDate: hasEndDate,
          check_isStartBeforeEnd: isStartBeforeEnd,
        }
      );
    }

    // Update the entire currentTrip state object AT ONCE
    setCurrentTrip((prevTrip) => {
      const tripId = prevTrip?.id; // User changed this from _id // Preserve existing ID if any
      const newTrip = {
        ...prevTrip, // Preserve other fields like image, userId etc.
        id: tripId, // User changed this from _id
        title: title || "My Trip", // Set title directly in currentTrip
        startDate: newTripStartDate, // Set the root startDate here
        endDate: newTripEndDate,     // Set the root endDate here
        content: newContent, // Set content directly in currentTrip
      };
      console.log("Setting new currentTrip context:", newTrip);
      return newTrip;
    });

    if (newContent.length > 0) {
      setSelectedDay(newContent[0]);
      console.log("Resetting selectedDay to:", newContent[0]);
    } else {
      setSelectedDay(null);
      console.log("Resetting selectedDay to null as content is empty.");
    }
  }

  // Added function to select a specific day
  function selectDay(day) {
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
      const response = await apiClient.get(`/api/tplan/${tripId}`, {
        withCredentials: true,
      });
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

  const loginUser = useCallback(
    (userData) => {
      setUser(userData);
      setIsAuthenticated(true);
      console.log("AppContext: User logged in, isAuthenticated set to true.");

      const redirectPath = localStorage.getItem("redirectPath");
      if (redirectPath) {
        localStorage.removeItem("redirectPath");
        navigate(redirectPath);
      } else {
        navigate("/profile"); // Default redirect path
      }
    },
    [navigate, setUser, setIsAuthenticated]
  );

  const logoutUser = useCallback(async () => {
    const currentPath = location.pathname; // Store current path before logout
    try {
      await apiClient.post("/auth/logout");
      console.log("AppContext: Logout successful on backend.");
    } catch (error) {
      console.error("AppContext: Error during backend logout:", error);
    }
    setUser(null);
    setIsAuthenticated(false);
    setSelectedDay(null); // Clear selected day
    // setTripTitle("My Trip"); // Reset trip title to default
    // setTripLocation(null); // Clear trip location
    // setCurrentTrip(null); // Clear current trip data from state
    // localStorage.removeItem("currentTrip"); // Clear current trip from localStorage
    // localStorage.removeItem("tripTitle");
    // localStorage.removeItem("tripLocation");
    console.log("AppContext: User logged out, isAuthenticated set to false.");
    // Navigate to the page the user was on, or a default like home
    navigate(currentPath); // Redirect to the page user was on
  }, [navigate, location, setUser, setIsAuthenticated, setSelectedDay]);

  const updateUser = useCallback((updatedUserData) => {
    setUser(updatedUserData);
    setIsAuthenticated(true);
    console.log("AppContext: User update with new name.");
  }, []);

  const clearCurrentTrip = useCallback(() => {
    setCurrentTrip(null);
    localStorage.removeItem("currentTrip");
    // Optionally reset title and location as well if they are tied to a specific trip
    // setTripTitle("My Trip");
    // setTripLocation(null);
    // setSelectedDay(null);
  }, [setCurrentTrip]); // Removed setTripTitle, setTripLocation, setSelectedDay as they might not always need reset

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
    moveItemAcrossDays,
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
    clearCurrentTrip,
    // For Generic Confirm Modal
    isConfirmModalOpen,
    confirmModalConfig,
    showConfirmModal,
    hideConfirmModal,
    // For Success Toast
    isSuccessToastOpen,
    successToastMessage,
    showSuccessToast, // Ensure the actual function is provided
    hideSuccessToast,
  };

  return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
}

export { AppContext, AppContextProvider };
