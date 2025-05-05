import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import axios from 'axios';

const LocationPopup = ({ location, onClose }) => {
  const [placeDetails, setPlaceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInfoWindow, setShowInfoWindow] = useState(true);

  // Extract all anime names (English and Japanese) from arrays
  const getAnimeNames = () => {
    if (location?.anime_en_names?.length > 0) {
      return location.anime_en_names.map((name, index) => ({
        en_name: name,
        jp_name: location.anime_names?.[index] || null,
      }));
    }
    if (location?.animeName) {
      return location.animeName.split(',').map(name => ({
        en_name: name.trim(),
        jp_name: null,
      }));
    }
    return [];
  };

  useEffect(() => {
    if (!location) return;

    const fetchPlaceDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get place details from Google Maps
        const response = await axios.post('/api/gmap/', {
          lat: location.lat,
          lng: location.lng,
        });

        setPlaceDetails(response.data);
      } catch (err) {
        console.error('Error fetching place details:', err);
        setError('Failed to load location info');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaceDetails();
  }, [location]);

  if (!location) return null;

  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };

  const center = {
    lat: location.lat,
    lng: location.lng
  };

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition shadow-md"
          >
            <span className="w-6 h-6 text-gray-600 text-xl font-bold">×</span>
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
              <LoadScript googleMapsApiKey={apiKey} language="en">
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
                  }}
                >
                  <Marker
                    position={center}
                    title={location.names || placeDetails?.name}
                    onClick={() => setShowInfoWindow(true)}
                  />
                  
                  {showInfoWindow && placeDetails && (
                    <InfoWindow
                      position={center}
                      onCloseClick={() => setShowInfoWindow(false)}
                    >
                      <div className="max-w-xs">
                        <h3 className="font-bold text-lg">{placeDetails.name || location.names}</h3>
                        <p className="text-sm mt-1">{placeDetails.address}</p>
                        {placeDetails.rating && (
                          <p className="text-sm mt-1">
                            ⭐ {placeDetails.rating} ({placeDetails.total_ratings} reviews)
                          </p>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 400px - 2rem)' }}>
          {/* Location title */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {location.names || placeDetails?.name || location.city}
            </h2>
            
            {/* Address */}
            <p className="text-lg text-gray-600">
              {placeDetails?.address || location.addresses?.[0] || 'Address not available'}
            </p>
          </div>

          {/* Related Anime */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Related Anime</h3>
            {getAnimeNames().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getAnimeNames().map((anime, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow bg-white"
                  >
                    <p className="text-base font-semibold text-gray-900">{anime.en_name}</p>
                    {anime.jp_name && (
                      <p className="text-sm text-gray-600 mt-1">
                        {anime.jp_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No related anime information available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPopup;