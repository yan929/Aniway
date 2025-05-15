import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../util/api";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { IoClose } from "react-icons/io5";
import { FaCheck } from "react-icons/fa";

const LocationPopup = ({ location, onClose, onToggleInItinerary, isAdded }) => {
  const [placeDetails, setPlaceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInfoWindow, setShowInfoWindow] = useState(true);
  const navigate = useNavigate();

  // Create a ref for the modal content
  const modalContentRef = useRef(null);

  // Extract all anime names (English and Japanese) from arrays
  const getAnimeNames = () => {
    if (location?.anime_en_names?.length > 0) {
      return location.anime_en_names.map((name, index) => ({
        en_name: name,
        jp_name: location.anime_names?.[index] || null,
      }));
    }
    if (location?.animeName) {
      return location.animeName.split(",").map((name) => ({
        en_name: name.trim(),
        jp_name: null,
      }));
    }
    return [];
  };

  // Helper function to get the marker title as a string
  const getMarkerTitle = () => {
    // If location.names is an array, take the first element
    if (Array.isArray(location.names)) {
      return location.names[0] || placeDetails?.name || "Location";
    }
    // If it's a string, use it directly
    if (typeof location.names === "string") {
      return location.names;
    }
    // Fall back to placeDetails name or default
    return placeDetails?.name || "Location";
  };

  // Handle click on the overlay background to close the popup
  const handleBackgroundClick = (e) => {
    // Only close if the click is on the background, not on the modal content
    if (
      modalContentRef.current &&
      !modalContentRef.current.contains(e.target)
    ) {
      onClose();
    }
  };

  const handleNavigateAnime = async (name) => {
    try {
      const encodedName = encodeURIComponent(name);

      const response = await apiClient.get(`/api/anime/${encodedName}`);
      const data = await response.data;

      navigate(`/anime/${data.id}`);
      onClose();
    } catch (error) {
      console.error("Error fetching anime info:", error);
    }
  };

  useEffect(() => {
    if (!location) return;

    const fetchPlaceDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get place details from Google Maps
        const response = await apiClient.post("/api/gmap/place_by_latlng", {
          lat: location.lat,
          lng: location.lng,
        });

        setPlaceDetails(response.data);
      } catch (err) {
        console.error("Error fetching place details:", err);
        setError("Failed to load location info");
      } finally {
        setLoading(false);
      }
    };

    fetchPlaceDetails();
  }, [location]);

  if (!location) return null;

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
  };

  const center = {
    lat: location.lat,
    lng: location.lng,
  };

  return (
    // Add onClick handler to the background overlay
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      onClick={handleBackgroundClick}
    >
      {/* Add ref to the modal content and prevent click propagation */}
      <div
        ref={modalContentRef}
        className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        {/* Header */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 p-2 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition shadow-md flex items-center justify-center"
          >
            <IoClose className="text-3xl text-gray-700" />
          </button>

          {/* Google Map */}
          <div className="w-full h-[400px] bg-gray-200">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : error ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-red-500">{error}</p>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={15}
                options={{
                  disableDefaultUI: false,
                  zoomControl: true,
                  streetViewControl: true,
                  mapTypeControl: true,
                  fullscreenControl: true,
                  fullscreenControlOptions: {
                    position: window.google.maps.ControlPosition.TOP_LEFT,
                  },
                }}
              >
                <Marker
                  position={center}
                  title={getMarkerTitle()}
                  onClick={() => setShowInfoWindow(true)}
                />

                {showInfoWindow && placeDetails && (
                  <InfoWindow
                    position={center}
                    // onCloseClick={() => setShowInfoWindow(false)}
                  >
                    <div className="max-w-xs dark:bg-gray-800">
                      <h3 className="font-bold text-lg dark:text-gray-200">
                        {placeDetails.name || location.names}
                      </h3>
                      <p className="text-sm mt-1">{placeDetails.address}</p>
                      {placeDetails.rating && (
                        <p className="text-sm mt-1">
                          ⭐ {placeDetails.rating} ({placeDetails.total_ratings}{" "}
                          reviews)
                        </p>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          className="p-6 overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 400px - 2rem)" }}
        >
          {/* Location title and Add button */}
          <div className="mb-6 flex justify-center items-start dark:bg-gray-800">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-200 mb-2 ">
                {location.names || placeDetails?.name || location.city}
              </h2>

              {/* Address */}
              <p className="text-lg text-gray-600 dark:text-gray-200">
                {placeDetails?.address ||
                  location.addresses?.[0] ||
                  "Address not available"}
              </p>
            </div>

            {/* Add to itinerary checkbox */}
            {onToggleInItinerary && (
              <div
                className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50"
                onClick={() => onToggleInItinerary(location)}
              >
                <div
                  className={`w-5 h-5 border rounded flex items-center justify-center ${
                    isAdded
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {isAdded && <FaCheck size={12} className="text-green-500" />}
                </div>
                <span
                  className={`font-medium ${
                    isAdded
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-gray-700"
                  }`}
                >
                  {isAdded ? "Added to Itinerary" : "Add to Itinerary"}
                </span>
              </div>
            )}
          </div>

          {/* Related Anime */}
          <div className="dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">
              Related Anime
            </h3>
            {getAnimeNames().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getAnimeNames().map((anime, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition-shadow bg-white dark:bg-gray-800 cursor-pointer"
                    onClick={() => handleNavigateAnime(anime.en_name)}
                  >
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-200">
                      {anime.en_name}
                    </p>
                    {anime.jp_name && (
                      <p className="text-sm text-gray-600 mt-1 dark:text-gray-200">
                        {anime.jp_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-200">
                No related anime information available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPopup;
