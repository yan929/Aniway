import React, { useState, useRef, useEffect } from 'react';

function UserDropdown() {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef(null);

        const toggleDropdown = () => {
            setIsOpen(!isOpen);
        };

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
            }
        };

        useEffect(() => {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, []);

    return (
        <div className="dropdown" ref={dropdownRef}>
        <button onClick={toggleDropdown}>
            {isOpen ? 'Close Dropdown' : 'Open Dropdown'}
        </button>
        {isOpen && (
            <ul className="dropdown-menu">
                <li>{username}</li>
                <li><Link to="/tripplanner">My Trips</Link></li>
                <li><Link to="/api/logout">Logout</Link></li>
            </ul>
        )}
        </div>
    );
}

export default UserDropdown;