// frontend/src/components/ChatGPTDemo.jsx
import React, { useState } from "react";
import apiClient from "../util/api";
import "./index.css";

function ChatGPTDemo() {
  const [prompt, setPrompt] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [itinerary, setItinerary] = useState([]);
  const [rawJson, setRawJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt || !startDate || !endDate) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);
    setItinerary([]);
    setRawJson("");

    try {
      const res = await apiClient.post(`/api/chatgpt/itinerary`, {
        prompt,
        startDate,
        endDate,
      });

      // setItinerary(res.data.itinerar);
      setRawJson(JSON.stringify(res.data, null, 2));
    } catch (err) {
      console.error(err);
      setError("Failed to fetch itinerary from ChatGPT.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🌏 Travel Itinerary Planner with ChatGPT</h2>
      <input
        type="text"
        placeholder="e.g., Plan a relaxing trip to Tokyo"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
      />
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Itinerary"}
        </button>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {itinerary.length > 0 && (
        <div>
          <h3>🗓️ Your Itinerary</h3>
          {itinerary.map((day, index) => (
            <div key={index} style={{ marginBottom: "1rem" }}>
              <strong>{day.date}</strong>
              <ul>
                {day.activities.map((activity, idx) => (
                  <li key={idx}>
                    <strong>{activity.time}</strong>: {activity.description}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}{" "}
      */}
      {rawJson && (
        <div style={{ marginTop: "2rem" }}>
          <h3>📦 Raw JSON Response</h3>
          <pre
            style={{
              color: "#000000",
              padding: "1rem",
              backgroundColor: "#f0f0f0",
              borderRadius: "6px",
              overflowX: "auto",
              maxHeight: "400px",
            }}
          >
            {rawJson}
          </pre>
        </div>
      )}
    </div>
  );
}

export default ChatGPTDemo;
