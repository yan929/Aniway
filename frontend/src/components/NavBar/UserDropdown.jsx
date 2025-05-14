import { useRef } from "react";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { Link } from "react-router-dom";

function UserDropdown({ user, onLogout, isOpen, setIsOpen }) {
  const dropdownRef = useRef(null);
  return (
    <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
      {isOpen && (
        <ul className="absolute right-3 top-full mt-6 w-48 bg-white rounded-lg shadow-lg py-1 z-50 dark:bg-gray-800">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
            <p className="font-medium text-gray-800 dark:text-gray-800">{user.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 truncate">{user.email}</p>
          </div>
          <li>
            <Link
              to={`/profile/${user.id}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-800"
            >
              <FaUser className="mr-2 text-gray-600 dark:text-gray-600" />
              My Trips
            </Link>
          </li>
          <li>
            <Link
              to={`/profile/${user.id}/setting`}
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-800"
            >
              <IoMdSettings className="mr-2 text-gray-600 dark:text-gray-600" />
              Setting
            </Link>
          </li>
          <li>
            <Link
              to="/api/logout"
              onClick={onLogout}
              className="flex items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-800"
            >
              <FaSignOutAlt className="mr-2 text-gray-600 dark:text-gray-600" />
              Logout
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}

export default UserDropdown;