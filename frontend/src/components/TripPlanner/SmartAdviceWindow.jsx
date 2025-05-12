import { useState, useContext } from "react";
import apiClient from "../../util/api";
import DisplayAniLoc from "../AniInfo/AniLoc";
import { AppContext } from "../../context/AppContext";

export default function SmartAdvice({ isOpen, onClose, day }) {
    const { updateItinerary, currentTrip } = useContext(AppContext);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [userInput, setUserInput] = useState("");
    const [suggestions, setSuggestions] = useState([]);

    if (!isOpen) return null;

    const handleBackgroundClick = (e) => {
        if (e.target.id === "smart-advice-backdrop") {
            onClose();
        }
    };

    const handleAdvice = async (prompt) => {
        console.log("Prompt:", prompt);

        if (!prompt) {
            setError("Please fill in all fields.");
            return;
        }

        setError("");
        setLoading(true);
        setSuggestions([]);

        try {
            console.log("day for advice:", day);
            const res = await apiClient.post(`/api/ai/advice`, {
                prompt: prompt,
                currentItinerary: day,
            });

            console.log("Response Data from API (suggestions):", res.data);
            if (Array.isArray(res.data)) {
                const transformedSuggestions = res.data.map(item => ({
                    id: item.id,
                    locationName: item.name,
                    image: item.image,
                    addresses: item.addresses,
                    ep: item.ep,
                    lat: item.lat,
                    lng: item.lng,
                    gpPlaceId: item.gpPlaceId
                }));
                setSuggestions(transformedSuggestions);
            } else {
                console.error("API did not return an array for suggestions:", res.data);
                setError("Received invalid data for suggestions from server.");
                setSuggestions([]);
            }
        } catch (err) {
            console.error("Error fetching suggestions:", err);
            setError("Failed to fetch suggestions.");
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSuggestionToItinerary = async (clickedSuggestion) => {
        if (!currentTrip || !currentTrip.content || !day || !day.date) {
            setError("Cannot add to itinerary: essential trip data is missing.");
            console.error("Missing currentTrip, currentTrip.content, or day.date");
            return;
        }
        console.log("Attempting to add to itinerary:", clickedSuggestion);

        try {
            console.log("Calling /api/gmap/place_by_nearby with params:", {
                keyword: clickedSuggestion.locationName,
                lat: clickedSuggestion.lat,
                lng: clickedSuggestion.lng,
            });

            const apiClientResponse = await apiClient.get("/api/gmap/place_by_nearby", {
                params: {
                    keyword: clickedSuggestion.locationName,
                    lat: clickedSuggestion.lat,
                    lng: clickedSuggestion.lng,
                }
            });

            const enrichedLocationDataFromAPI = apiClientResponse.data;
            console.log("Received enrichedLocationData from API:", enrichedLocationDataFromAPI);

            if (!enrichedLocationDataFromAPI || !enrichedLocationDataFromAPI.place_id) {
                setError("Failed to get complete location details or Google Place ID from the server.");
                console.error("API response missing place_id:", enrichedLocationDataFromAPI);
                return;
            }

            // Construct image URL using photo_reference
            let imageUrl = clickedSuggestion.image; // Default to the image from the suggestion list (e.g., anitabi image)
            if (enrichedLocationDataFromAPI.photo_reference) {
                // ASSUMPTION: Your backend route for fetchPlacePhotoByPlaceId is /api/gmap/photo_by_reference
                // This URL will point to your backend, which then serves the image from Google.
                imageUrl = `/api/gmap/photo_by_reference?photo_reference=${enrichedLocationDataFromAPI.photo_reference}`;
                console.log("Constructed Google Place photo URL (via backend):", imageUrl);
            } else {
                console.log("No photo_reference from Google, using existing image:", imageUrl);
            }

            const targetDayItinerary = currentTrip.content.find(d => d.date === day.date)?.itinerary || [];
            const newItemOrder = targetDayItinerary.length + 1;

            const newItemToAdd = {
                date: day.date,
                gpPlaceId: enrichedLocationDataFromAPI.place_id,
                name: enrichedLocationDataFromAPI.name,
                lat: enrichedLocationDataFromAPI.location?.lat,
                lng: enrichedLocationDataFromAPI.location?.lng,
                address: enrichedLocationDataFromAPI.address,
                image: imageUrl, // Store the determined image URL
                order: newItemOrder,
                arrivalTime: "12:00",
                note: "Added from Smart Advice",
            };

            if (newItemToAdd.lat === undefined || newItemToAdd.lng === undefined) {
                setError("Location latitude or longitude is missing after fetching details.");
                console.error("Missing lat/lng in newItemToAdd:", newItemToAdd);
                return;
            }

            // Correctly prepare arguments for updateItinerary
            // Find the existing itinerary for the target day from currentTrip.content
            const targetDayObject = currentTrip.content.find(d => d.date === newItemToAdd.date);
            const existingItineraryForDay = targetDayObject ? targetDayObject.itinerary : [];

            // Create the new complete itinerary array for the day by appending the new item
            const newItineraryForDay = [...existingItineraryForDay, newItemToAdd];


            updateItinerary(newItemToAdd.date, newItineraryForDay);


        } catch (err) {
            console.error("Error adding suggestion to itinerary or fetching details:", err);
            setError(err.response?.data?.message || err.message || "Could not add location to itinerary.");
        }

    };

    return (
        <div
            id="smart-advice-backdrop"
            className="fixed inset-0 bg-[rgba(0,0,0,0.2)] flex justify-center items-center z-50"
            onClick={handleBackgroundClick}
        >
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl animate-fadeIn relative">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Smart Advice</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-black text-2xl absolute top-3 right-4"
                    ></button>
                </div>

                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Enter your preferences..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <button
                        onClick={() => {
                            handleAdvice(userInput);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
                    >
                        {loading ? "Generating..." : "Itinerary Advice"}
                    </button>

                    {!loading && suggestions.length > 0 && (
                        <p className="text-xs text-gray-600 mt-0 text-left">
                            Found {suggestions.length} location(s).
                        </p>
                    )}

                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                    {!loading && !error && suggestions.length > 0 && (
                        <div className="mt-4 pt-4  border-t border-gray-200">
                            <div className="max-h-96 p-4 overflow-y-auto">
                                <DisplayAniLoc
                                    aniLocList={suggestions}
                                    cardClassName="h-32"
                                    showListTitle={true}
                                    onLocationClick={handleAddSuggestionToItinerary}
                                />
                            </div>
                        </div>
                    )}
                    {!loading && !error && suggestions.length === 0 && userInput && (
                        <p className="text-gray-500 text-sm mt-2">No suggestions found based on your input after searching.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
