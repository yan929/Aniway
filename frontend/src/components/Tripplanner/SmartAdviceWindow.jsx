import { useState } from 'react';
import axios from 'axios';


export default function SmartAdvice({ isOpen, onClose, day }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userInput, setUserInput] = useState('');
    const [rawJson, setRawJson] = useState('');
    const apiBase = import.meta.env.VITE_BACKEND_API;

    if (!isOpen) return null;


    const handleBackgroundClick = (e) => {
        if (e.target.id === "smart-advice-backdrop") {
            onClose();
        }
    }

    const handleAdvice = async (prompt) => {

        console.log("Prompt:", prompt);

        if (!prompt) {
            setError('Please fill in all fields.');
            return;
        }

        setError('');
        setLoading(true);
        setRawJson('');

        try {
            const res = await axios.post(`${apiBase}/api/ai/advice`, {
                prompt: prompt,
                startDate: day.date,
                endDate: day.date,
            });

            // setItinerary(res.data.itinerar);
            setRawJson(JSON.stringify(res.data, null, 2));
            console.log("Response:", rawJson);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch itinerary from ChatGPT.');
        } finally {
            setLoading(false);
        }

    }




    return (
        <div id="smart-advice-backdrop"
            className="fixed inset-0 bg-[rgba(0,0,0,0.2)] flex justify-center items-center z-50"
            onClick={handleBackgroundClick}>
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md animate-fadeIn relative">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Smart Advice</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-black text-2xl absolute top-3 right-4"
                    >
                    </button>
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
                        {loading ? 'Generating...' : 'Itinerary Advice'}
                    </button>
                </div>
            </div>
        </div>
    );
}
