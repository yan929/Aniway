import React, { useState, useContext } from "react";
import apiClient from "../../util/api";
import { AppContext } from "../../context/AppContext";
function UserForm({ user }) {
  const [name, setName] = useState(user.name);

  const { updateUser } = useContext(AppContext);

  const handleSave = async () => {
    // Save the updated user information
    console.log("User information saved:", { name });

    try {
      const response = await apiClient.patch(
        "/api/user/profile",
        { name },
        { withCredentials: true }
      );
      console.log("Response: ", response);
      if (!response) {
        console.log("Error: ", response);
        return;
      }

      const data = response.data;
      console.log("User information saved successfully:", response.data);

      console.log("User information saved successfully:", data.user);

      setName(data.user.name);
      updateUser(data.user);
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  return (
    <>
      <div className=" pt-6 pr-6 pb-6  rounded-md">
        <div className="flex flex-col items-left mb-8 relative">
          <div className="flex items-center space-x-4 mb-4">
            <img
              src={user.avatar}
              alt={user.name || "User Avatar"}
              className="w-15 h-15 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-gray-800 text-left">
                {user.name}
              </p>
              <p className="text-sm text-gray-500 text-left">{user.email}</p>
              <p className="text-sm text-gray-500 text-left">User</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-500 mb-1 block text-left">
              Username
            </label>
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block text-left">
              Email
            </label>
            <input
              type="text"
              defaultValue={user.email}
              className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-start">
          <button
            className="bg-gray-800 text-white font-semibold px-5 py-2 rounded-full hover:bg-gray-900 mt-4"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}

export default UserForm;
