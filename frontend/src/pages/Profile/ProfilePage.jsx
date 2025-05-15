import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/Layout/NavBar";
import apiClient from "../../util/api";
import { AppContext } from "../../context/AppContext.jsx";
import TripCard from "../../components/TripPlanner/TripCard";
import { FaPlus } from "react-icons/fa";

const ProfilePage = () => {
  const {
    user,
    isAuthenticated,
    isAuthLoading,
    loadCurrentTrip,
    clearCurrentTrip,
  } = useContext(AppContext);
  const [trips, setTrips] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);
  // Local loading state for data fetching, distinct from auth loading
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const navigate = useNavigate();
  const { userId } = useParams(); // Still useful if you plan to view other users' profiles (public part)

  useEffect(() => {
    // Effect for handling authentication status changes
    if (!isAuthLoading) {
      if (!isAuthenticated || !user) {
        navigate("/login");
        return;
      } else if (user && user.id !== userId && userId) {
        // Optional: If route is /profile/:userId and it's not the current user's ID,
        // handle accordingly (e.g. show public view or redirect if not allowed)
        // For now, assuming /profile/:userId is for the logged-in user primarily.
        // If your app structure means /profile/:userId should ALWAYS match logged in user,
        // you might redirect to /profile/${user._id} or simplify.
        console.warn(
          `ProfilePage: Accessed with userId param ${userId} but logged in user is ${user?._id}.`
        );
        // Potentially navigate(`/profile/${user._id}`) or handle as an error/specific view.
      }
    }
  }, [isAuthLoading, isAuthenticated, user, navigate, userId]);

  useEffect(() => {
    // Effect for fetching data once authenticated
    const fetchData = async () => {
      // Ensure user is authenticated and their data is available before fetching trips
      if (!isAuthenticated || !user) {
        // This check might be redundant if the above useEffect handles redirection correctly,
        // but kept for safety.
        console.log(
          "ProfilePage: fetchData - User not authenticated or user data missing."
        );
        return;
      }

      setIsDataLoading(true);
      setError(null);
      try {
        const tripsResponse = await apiClient.get("/api/tplan", {
          withCredentials: true, // Assuming this fetches trips for the logged-in user
        });

        const tripsData = tripsResponse.data;
        console.log("Fetched trips:", tripsData);

        const now = new Date();
        now.setHours(0, 0, 0, 0); // Set to start of today
        const active = [];
        const completed = [];

        tripsData.forEach((trip) => {
          let endDate = null;
          if (trip.endDate) {
            endDate = new Date(trip.endDate);
            endDate.setHours(0, 0, 0, 0);
          } else if (trip.content && trip.content.length > 0) {
            const lastDay = trip.content[trip.content.length - 1].date;
            endDate = new Date(lastDay);
            endDate.setHours(0, 0, 0, 0);
          }
          if (endDate && endDate < now) {
            completed.push(trip);
          } else {
            active.push(trip);
          }
        });

        setTrips(active);
        setCompletedTrips(completed);
      } catch (err) {
        console.error("Error fetching trip data:", err);
        if (err.response && err.response.status === 401) {
          // This specific 401 might indicate session expired *during* app use,
          // AppContext's checkUserSession might not re-run automatically after this.
          // Forcing a logout or relying on AppContext to eventually catch up might be needed.
          // However, the primary redirection should already have happened.
          setError("Session expired. Please log in again.");
          // navigate("/login"); // Redirection is now primarily handled by the auth status effect
        } else {
          setError("Failed to load trip data. " + (err.message || ""));
        }
      }
      setIsDataLoading(false);
    };

    if (!isAuthLoading && isAuthenticated && user) {
      // Only fetch data if auth is resolved, user is authenticated, and user object is available
      fetchData();
    }
    // Dependencies: isAuthLoading, isAuthenticated, user (to re-fetch if user changes, e.g. admin viewing different profiles if that was a feature)
  }, [isAuthLoading, isAuthenticated, user]);

  const handleDeleteTrip = async (tripToDelete) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this trip? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await apiClient.delete(
        `/api/tplan/${tripToDelete._id || tripToDelete.id}`,
        {
          withCredentials: true,
        }
      );
      setTrips((prev) =>
        prev.filter(
          (t) => (t._id || t.id) !== (tripToDelete._id || tripToDelete.id)
        )
      );
      setCompletedTrips((prev) =>
        prev.filter(
          (t) => (t._id || t.id) !== (tripToDelete._id || tripToDelete.id)
        )
      );
    } catch (err) {
      console.error("Failed to delete trip:", err);
      setToastMessage("Failed to delete trip. Please try again.");
      setIsToastVisible(true);
    }
  };

  // Handles Auth Loading State
  if (isAuthLoading) {
    return (
      <>
        <NavBar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <span>Authenticating...</span>
        </div>
      </>
    );
  }

  // Handles Error State (after auth is resolved and data fetch attempted)
  if (error) {
    return (
      <>
        <NavBar />
        <div className="text-center p-8 mt-16">
          <h2 className="text-xl font-bold text-red-500">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate("/login")} // Or retry logic
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Login
          </button>
        </div>
      </>
    );
  }

  // Handles Data Loading State (after auth is resolved and user is authenticated)
  if (isDataLoading && isAuthenticated) {
    // Show data loading only if authenticated
    return (
      <>
        <NavBar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <span>Loading profile data...</span>
        </div>
      </>
    );
  }

  // Main content render, only if authenticated and not loading
  // If not authenticated, the first useEffect should have redirected.
  if (!isAuthenticated) {
    // This is a fallback, should ideally not be reached if the redirection logic works.
    return (
      <>
        <NavBar />
        <div className="text-center p-8 mt-16">
          <p>Redirecting to login...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="bg-gray-100 min-h-screen pt-20 px-4 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          {user && ( // Check user again before accessing its properties
            <div className="text-center mb-4 pt-4">
              <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-100">
                Welcome, {user.displayName || user.name || user.email}!
              </h2>
            </div>
          )}
          <h1 className="text-2xl font-bold text-center mb-8">My Trip</h1>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8 dark:bg-gray-800">
            <button
              className="w-full py-4 bg-gray-100 text-[#626fe3] font-bold rounded-md flex items-center justify-center hover:bg-purple-50 dark:bg-gray-700 dark:text-purple-300 dark:hover:bg-gray-600"
              onClick={() => {
                clearCurrentTrip();
                navigate("/tripplanner");
              }}
            >
              <FaPlus className="w-3 h-3 mr-2" />
              Build a trip with AI
            </button>
          </div>

          {trips.length === 0 && !isDataLoading && (
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8 text-center dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">
                Your active trips will appear here.
              </p>
            </div>
          )}
          {trips.length > 0 && (
            <div className="space-y-4 mb-8">
              {trips.map((trip) => (
                <TripCard
                  key={trip._id || trip.id}
                  user={user}
                  trip={{
                    ...trip,
                    // Pass missing fields as undefined for now
                    startDate: trip.startDate || undefined,
                    endDate: trip.endDate || undefined,
                    destination: trip.destination || undefined,
                  }}
                  onDelete={() => handleDeleteTrip(trip)}
                  onClick={async () => {
                    await loadCurrentTrip(trip._id || trip.id);
                    navigate("/tripplanner");
                  }}
                />
              ))}
            </div>
          )}

          <h2 className="text-2xl font-bold text-center mb-8">
            Completed trips
          </h2>

          {completedTrips.length === 0 && !isDataLoading && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Your completed trips will appear here.
              </p>
            </div>
          )}
          {completedTrips.length > 0 && (
            <div className="space-y-4">
              {completedTrips.map((trip) => (
                <TripCard
                  key={trip._id || trip.id}
                  user={user}
                  trip={{
                    ...trip,
                    startDate: trip.startDate || undefined,
                    endDate: trip.endDate || undefined,
                    destination: trip.destination || undefined,
                  }}
                  onDelete={() => handleDeleteTrip(trip)}
                  onClick={async () => {
                    await loadCurrentTrip(trip._id || trip.id);
                    navigate("/tripplanner");
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {isToastVisible && (
        <ErrorToast
          message={toastMessage}
          onClose={() => {
            setIsToastVisible(false);
            setToastMessage("");
          }}
        />
      )}
    </>
  );
};

export default ProfilePage;
