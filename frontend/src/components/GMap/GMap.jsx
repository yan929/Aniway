import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import React, { useState } from "react";
import apiClient from "../../util/api";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 35.652832,
  lng: 139.839478,
};

function GMap({ locations }) {
  const [selected, setSelected] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);

  const handleMarkerClick = async (loc) => {
    setSelected(loc);
    setPhotoUrl(null);
    try {
      const response = await apiClient.post("/api/gmap/", {
        lat: loc.lat,
        lng: loc.lng,
      });

      const data = response.data;
      setPlaceDetails(data);

      if (data.photo_reference) {
        const photoRes = await apiClient.post(
          "/api/gmap/photo",
          { photo_reference: data.photo_reference },
          { responseType: "blob" }
        );

        const blob = photoRes.data;
        const url = URL.createObjectURL(blob);
        setPhotoUrl(url);
        // Wait for photo
      }
    } catch (err) {
      console.error(
        "Failed to fetch place details:",
        err.response
          ? `${err.response.status} ${err.response.statusText} - ${err.response.data}`
          : err.message
      );
      setPlaceDetails({ name: "Unknown", info: "No data found." });
    }
  };

  const center = locations?.length > 0 ? locations[0] : defaultCenter;

  return (
    <div className="w-full h-full">
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
        {locations?.map((loc, index) => (
          <Marker
            key={index}
            position={{ lat: loc.lat, lng: loc.lng }}
            title={`${index + 1}`}
            label={`${index + 1}`}
            onClick={() => handleMarkerClick(loc)}
          />
        ))}

        {selected && placeDetails && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => {
              setSelected(null);
              setPlaceDetails(null);
            }}
          >
            <div style={{ maxWidth: "400px" }}>
              <h3>{placeDetails.name || selected.label}</h3>
              <p>
                <strong>Address:</strong> {placeDetails.address}
              </p>
              {placeDetails.phone && (
                <p>
                  <strong>Phone:</strong> {placeDetails.phone}
                </p>
              )}
              {placeDetails.rating && (
                <p>
                  <strong>Rating:</strong> {placeDetails.rating} (
                  {placeDetails.total_ratings} reviews)
                </p>
              )}
              {placeDetails.website && (
                <p>
                  <strong>Website:</strong>{" "}
                  <a
                    href={placeDetails.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Site
                  </a>
                </p>
              )}
              <p>
                <strong>Open Now:</strong>{" "}
                {placeDetails.open_now ? "Yes" : "No"}
              </p>
              {placeDetails.opening_hours?.length > 0 && (
                <div>
                  <strong>Opening Hours:</strong>
                  <ul style={{ paddingLeft: "1.2em" }}>
                    {placeDetails.opening_hours.map((hour, idx) => (
                      <li key={idx}>{hour}</li>
                    ))}
                  </ul>
                </div>
              )}
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt={placeDetails.name}
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    borderRadius: "8px",
                  }}
                />
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export default GMap;
