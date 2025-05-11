import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext.jsx";

export default function TestSaveTrip() {
  const { tripData } = useContext(AppContext);
  const apiBase = import.meta.env.VITE_BACKEND_API;

  const saveToDB = async () => {
    try {
      const res = await fetch(`${apiBase}/api/trip/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "test-user-001", // 模拟一个用户 ID
          tripData,
        }),
      });

      const data = await res.json();
      console.log("✅ Response from server:", data);
    } catch (err) {
      console.error("❌ Failed to save trip:", err);
    }
  };

  return (
    <div className="p-4">
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={saveToDB}
      >
        Save Trip to DB
      </button>
    </div>
  );
}
