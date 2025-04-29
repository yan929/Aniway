import React from "react";

function UserDropdown() {
    const username = null
    return (
    <div>
        <ul>
            <li>{username}</li>
            <li><Link to=".">My Trips</Link></li>
            <li><Link to=".">Logout</Link></li>
        </ul>
    </div>
    )
}

export default UserDropdown;