import React, { useState, useRef, useEffect } from "react";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

function UserDropdown({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="dropdown" ref={dropdownRef}>
      <button onClick={toggleDropdown}>
        {isOpen ? "Close Dropdown" : "Open Dropdown"}
      </button>
      {isOpen && (
        <ul className="dropdown-menu">
          <li>{username}</li>
          <li>
            <Link to={`/profile/${userId}`} onClick={() => setIsOpen(false)}>
              My Trips
            </Link>
          </li>
          <li>
            <Link to="/api/logout" onClick={onLogout}>
              <FaSignOutAlt className="mr-2" />
              Logout
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}

export default UserDropdown;
