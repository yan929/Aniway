import { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import apiClient from "../../util/api.js";
import { AppContext } from "../../context/AppContext.jsx";

/**
 * NavBar component - Fixed navigation bar for the Aniway application
 * Displays the logo, application name, and user profile navigation
 */
function NavBar() {
  const { user, logoutUser } = useContext(AppContext);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

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

      // Make an API call to the backend logout endpoint
      await apiClient.get("/api/logout", { withCredentials: true });
      logoutUser();

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
            {user ? (
              // User is logged in
              user.avatar ? (
                // If avatar URL exists (user.avatar), display it
                <img
                  src={user.avatar}
                  alt={user.name || 'User Avatar'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                // Otherwise, show user initial in a circle
                <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white">
                  {userInitial}
                </div>
              )
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
