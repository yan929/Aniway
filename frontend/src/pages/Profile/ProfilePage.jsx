import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/Layout/NavBar";
import apiClient from "../../util/api";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { userId } = useParams();

  // Fetch user data and trips
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await apiClient.get("/api/user", {
          withCredentials: true,
        });

        const userData = userResponse.data;
        setUser(userData);

        // Fetch user trips
        const tripsResponse = await apiClient.get("/api/tplan", {
          withCredentials: true,
        });

        const tripsData = tripsResponse.data;
        console.log("Fetched trips:", tripsData);

        // Separate active and completed trips
        const now = new Date();
        const active = [];
        const completed = [];

        tripsData.forEach((trip) => {
          // Determine if trip is completed based on end date
          if (trip.content && trip.content.length > 0) {
            const lastDay = trip.content[trip.content.length - 1].date;
            const endDate = new Date(lastDay);

            if (endDate < now) {
              completed.push(trip);
            } else {
              active.push(trip);
            }
          } else {
            // If no dates, put in active trips
            active.push(trip);
          }
        });

        setTrips(active);
        setCompletedTrips(completed);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        if (err.response && err.response.status === 401) {
          navigate("/login");
        } else if (err.message === "Authentication failed") {
          navigate("/login");
        } else {
          setError("Failed to load profile data");
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [navigate, userId]);

  // Loading state
  if (loading) {
    return (
      <>
        <NavBar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <NavBar />
        <div className="text-center p-8 mt-16">
          <h2 className="text-xl font-bold text-red-500">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Login
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="bg-gray-100 min-h-screen pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          {user && (
            <div className="text-center mb-4 pt-4">
              <h2 className="text-2xl font-bold text-gray-700">
                Welcome, {user.displayName || user.name || user.email}!
              </h2>
              {/* You can add more user details here, e.g., profile picture */}
            </div>
          )}
          {/* My Trip section */}
          <h1 className="text-2xl font-bold text-center mb-8">My Trip</h1>

          {/* AI Trip Builder button */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <button
              className="w-full py-4 bg-gray-100 text-purple-600 rounded-md flex items-center justify-center hover:bg-purple-50"
              onClick={() => navigate("/tripplanner")}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
              Build a trip with AI
            </button>
          </div>

          {/* Active trips section - only show empty message if no trips */}
          {trips.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8 text-center">
              <p className="text-gray-500">
                Your active trips will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {trips.map((trip) => (
                <div
                  key={trip._id || trip.id}
                  className="bg-white rounded-lg shadow-sm p-4 cursor-pointer"
                  onClick={() =>
                    navigate(`/tripplanner?trip=${trip._id || trip.id}`)
                  }
                >
                  <h3 className="font-semibold text-lg">
                    {trip.title || "Untitled Trip"}
                  </h3>
                  {trip.content && trip.content.length > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      <span>
                        {new Date(trip.content[0].date).toLocaleDateString()} -
                        {new Date(
                          trip.content[trip.content.length - 1].date
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Completed trips section */}
          <h2 className="text-2xl font-bold text-center mb-8">
            Completed trips
          </h2>

          {completedTrips.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500">
                Your completed trips will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedTrips.map((trip) => (
                <div
                  key={trip._id || trip.id}
                  className="bg-white rounded-lg shadow-sm p-4 cursor-pointer"
                  onClick={() =>
                    navigate(`/tripplanner?trip=${trip._id || trip.id}`)
                  }
                >
                  <h3 className="font-semibold text-lg">
                    {trip.title || "Untitled Trip"}
                  </h3>
                  {trip.content && trip.content.length > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      <span>
                        {new Date(trip.content[0].date).toLocaleDateString()} -
                        {new Date(
                          trip.content[trip.content.length - 1].date
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
