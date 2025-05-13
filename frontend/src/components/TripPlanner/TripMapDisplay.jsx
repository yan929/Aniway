import { useMemo, useContext } from "react";
import { AppContext } from "../../context/AppContext.jsx";
import GMAPLocation from "../GMap/GMAPLocation";
import useMapLocationsLoader from "../../hooks/useMapLocationsLoader.js";

const TripMapDisplay = () => {
  const { currentTrip } = useContext(AppContext);
  const tripContent = useMemo(() => currentTrip?.content || [], [currentTrip]);
  const { mapLocations, isLoading, displayMessage } =
    useMapLocationsLoader(tripContent);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>Loading map...</div>
    );
  }

  const isErrorMessage =
    displayMessage &&
    (displayMessage.toLowerCase().includes("failed") ||
      displayMessage.toLowerCase().includes("no valid map locations") ||
      displayMessage.toLowerCase().includes("error"));

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <GMAPLocation baseLocations={mapLocations} />
      {displayMessage && (
        <div
          style={{
            textAlign: "center",
            padding: "10px",
            position: "absolute",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: "5px",
            zIndex: 10,
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            color: isErrorMessage ? "red" : "black",
            maxWidth: "90%",
          }}
        >
          {displayMessage}
        </div>
      )}
    </div>
  );
};

export default TripMapDisplay;
