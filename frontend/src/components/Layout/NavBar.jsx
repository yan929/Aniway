import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaSignOutAlt, FaCog } from "react-icons/fa";
import apiClient from "../../util/api.js";

/**
 * NavBar component - Fixed navigation bar for the Aniway application
 * Displays the logo, application name, and user profile navigation
 */
function NavBar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiClient.get(`/api/user`, {
          withCredentials: true,
        });
        console.log("NavBar: User data fetched:", response.data);
        setUser(response.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // User is not authenticated, this is an expected state.
          setUser(null);
        } else {
          // For other errors (network, server error), log them.
          console.error("Failed to fetch user:", error);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle profile icon click
  const handleProfileClick = () => {
    if (user) {
      setDropdownOpen(!dropdownOpen);
    } else {
      // Navigate to login page if not logged in
      navigate("/login");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Close dropdown
      setDropdownOpen(false);

      // Clear user state first for immediate UI feedback
      setUser(null);

      // Make an API call to the backend logout endpoint
      await apiClient.get("/api/logout", { withCredentials: true });

      // On successful logout, navigate to the homepage
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback navigation if something goes wrong
      navigate("/");
    }
  };

  // Navigate to profile page
  const goToProfile = () => {
    if (user) {
      const userId = user.id || user._id || user.google_id;
      if (userId) {
        setDropdownOpen(false);
        navigate(`/profile/${userId}`);
      }
    }
  };

  // Get user's initial for avatar
  const userInitial =
    user && user.name ? user.name.charAt(0).toUpperCase() : "A";

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img
            src="/aniway.png"
            alt="Aniway Logo"
            className="w-10 h-10 rounded-full object-contain mr-2"
          />
          <span className="text-gray-600 font-medium">Aniway</span>
        </Link>

        <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
          <div
            onClick={handleProfileClick}
            className="cursor-pointer"
            aria-label="User Profile or Login"
          >
            {loading ? (
              // Optional: Show a loading spinner or a placeholder while checking auth
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <FaUser className="text-gray-500 animate-pulse" />
              </div>
            ) : user ? (
              // Show user initial in a blue circle if logged in
              <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white">
                {userInitial}
              </div>
            ) : (
              // Show "Sign In" text if not logged in
              <span className="text-gray-700 hover:text-blue-500 font-medium">
                Sign In
              </span>
            )}
          </div>

          {/* Dropdown menu */}
          {dropdownOpen && user && (
            <div className="absolute right-0 top-10 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="font-medium text-gray-800">{user.name}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>

              <button
                onClick={goToProfile}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
              >
                <FaUser className="mr-2 text-gray-600" />
                <span>Profile</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-red-500"
              >
                <FaSignOutAlt className="mr-2" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
