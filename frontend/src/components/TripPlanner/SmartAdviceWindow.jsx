import { useState } from "react";
import apiClient from "../../util/api";
import DisplayAniLoc from "../AniInfo/AniLoc";

export default function SmartAdvice({ isOpen, onClose, day }) {
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
            console.log("day", day);
            const res = await apiClient.post(`/api/ai/advice`, {
                prompt: prompt,
                currentItinerary: day,
            });

            console.log("Response Data from API:", res.data);
            if (Array.isArray(res.data)) {
                const transformedSuggestions = res.data.map(item => ({
                    id: item.id,
                    locationName: item.name,
                    image: item.image,
                    addresses: item.addresses,
                    ep: item.ep,
                }));
                setSuggestions(transformedSuggestions);
            } else {
                console.error("API did not return an array:", res.data);
                setError("Received invalid data from server.");
                setSuggestions([]);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to fetch suggestions.");
            setSuggestions([]);
        } finally {
            setLoading(false);
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

                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                    {!loading && !error && suggestions.length > 0 && (
                        <div className="mt-4 pt-4 p-4 border-t border-gray-200 max-h-100 overflow-y-auto">
                            <h3 className="text-lg font-semibold mb-3 text-gray-700">Suggested Locations:</h3>
                            <DisplayAniLoc
                                aniLocList={suggestions}
                                cardClassName="h-30"
                                onLocationClick={(location) => {
                                    console.log("Suggested location clicked from SmartAdviceWindow:", location);
                                }}
                            />
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
