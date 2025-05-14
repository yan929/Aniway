import { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../util/api.js";
import { AppContext } from "../../context/AppContext.jsx";
import UserDropdown from "../NavBar/UserDropdown.jsx";
import ThemeToggleButton from "../ThemeToggleButton/ThemeToggleButton.jsx";

/**
 * NavBar component - Fixed navigation bar for the Aniway application
 * Displays the logo, application name, and user profile navigation
 */
function NavBar() {
  const { user, logoutUser } = useContext(AppContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
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

  useEffect(() => {
    if (user && user.avatar) {
      setAvatarLoadError(false);
    }
  }, [user]);

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

  // Get user's initial for avatar
  const userInitial =
    user && user.name ? user.name.charAt(0).toUpperCase() : "A";

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50 h-14 dark:text-gray-100  dark:bg-gray-900">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img
            src="/aniway.png"
            alt="Aniway Logo"
            className="w-10 h-10 rounded-full object-contain mr-2"
          />
          <span className="text-gray-600 font-medium dark:text-gray-100  dark:bg-gray-900">
            Aniway
          </span>
        </Link>

        <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
          <div
            onClick={handleProfileClick}
            className="cursor-pointer"
            aria-label="User Profile or Login"
          >
            {user ? (
              // User is logged in
              user.avatar && !avatarLoadError ? (
                // If avatar URL exists and no load error, display it
                <img
                  src={user.avatar}
                  alt={user.name || "User Avatar"}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={() => setAvatarLoadError(true)} // Set error on load failure
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
          <ThemeToggleButton />
          {user && (
            <UserDropdown
              user={user}
              onLogout={handleLogout}
              isOpen={dropdownOpen}
              setIsOpen={setDropdownOpen}
            />
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
