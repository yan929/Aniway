import React, { useState, useContext } from "react";
import apiClient from "../../util/api";
import { AppContext } from "../../context/AppContext";
function UserForm({user}) {
  const [name, setName] = useState(user.name);

  const { updateUser } = useContext(AppContext);

  const handleSave = async() => {

    // Save the updated user information
    console.log("User information saved:", { name });

    try{
      const response = await apiClient.patch("/api/user/profile", { name }, { withCredentials: true });
      console.log("Response: ", response);
      if(!response){
        console.log("Error: ", response);
        return; 
      }

      const data = response.data;
      console.log("User information saved successfully:", response.data);
      
      console.log("User information saved successfully:", data.user);
      
      setName(data.user.name);
      updateUser(data.user);

      
      

    }catch(error){
      console.log("Error: ", error);
    }
  }

  return (
    <>
    <div className="bg-gray-100 p-6 rounded-md">
      <h2 className="text-xl font-bold mb-1">Basic Information</h2>
      <hr className="border-gray-400 mb-2" />
      <div className="flex items-center space-x-4 mb-4">
        <img
                  src={user.avatar}
                  alt={user.name || "User Avatar"}
                  className="w-15 h-15 rounded-full object-cover"
                />
        <div>
          <p className="font-semibold text-gray-800">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-sm text-gray-500">User</p>
        </div>
      </div>
      <div className="mb-2">
  <label className="block font-medium text-gray-700">User name</label>
  <input
    type="text"
    className="w-full bg-gray-100 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
    value={name}
    onChange={(e) => setName(e.target.value)} 
    placeholder="Enter your name"     
  />
</div>
      <div className="mb-2">
        <label className="block font-medium text-gray-700">User email</label>
        <div className="flex items-center justify-between bg-gray-100 rounded px-3 py-2">
          <span className="text-sm text-gray-800">{user.email}</span>
          
        </div>
      </div>
      <button
        className="bg-gray-800 text-white font-semibold px-5 py-2 rounded-full hover:bg-gray-900"
        onClick={handleSave}
      >
        Save
      </button>
 
    </div>
    </>
  );
}

export default UserForm;
