import React from "react";
import { Link } from "react-router-dom";
import { FaUser } from "react-icons/fa";

/**
 * NavBar component - Fixed navigation bar for the Aniway application
 * Displays the logo, application name, and user profile placeholder
 */
function NavBar() {
  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
      <Link to="/" className="flex items-center">
          <img 
            src="/aniway.png" 
            alt="Aniway Logo" 
            className="w-10 h-10 rounded=full object-contain mr-2"
          />
          <span className="text-gray-600 font-medium">Aniway</span>
        </Link>
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer">
          <FaUser className="text-gray-500" />
        </div>
      </div>
    </nav>
  );
}

export default NavBar;