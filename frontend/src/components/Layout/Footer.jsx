import React from "react";
import { Link } from "react-router-dom";

/**
 * Footer component - Footer for the Aniway application
 * Displays the logo, navigation links, and copyright information
 */
function Footer() {
  return (
    <footer className="bg-white py-8 mt-auto dark:text-gray-100  dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Top Section with Logo and Links */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          {/* Logo and Name */}
          <div className="mb-6 md:mb-0">
            <Link to="/" className="flex items-center">
              <img 
                src="/aniway.png" 
                alt="Aniway Logo" 
                className="w-12 h-12 object-contain mr-2"
              />
              <span className="text-2xl font-medium text-gray-800 dark:text-gray-100  dark:bg-gray-900">Aniway</span>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center gap-8 text-gray-500 dark:text-gray-100  dark:bg-gray-900">
            <Link to="/about" className="hover:text-gray-700">About</Link>
            <Link to="/reference" className="hover:text-gray-700">Reference</Link>
            <Link to="/contact" className="hover:text-gray-700">Contact</Link>
          </div>
        </div>
        
        {/* Bottom Copyright Section */}
        <div className="text-center text-gray-400 dark:text-gray-100  dark:bg-gray-900">
          <p>© {new Date().getFullYear()} Aniway™. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;