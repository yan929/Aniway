import React from 'react';
import { useContext } from 'react';
import { AppContext } from '../../AppContextProvider.jsx';


export default function Sidebar() {
    const { tripData } = useContext(AppContext);

    const dates = Array.isArray(tripData)
        ? tripData.map(day => {
            const date = new Date(day.date);
            const dayLabel = date.toLocaleDateString('en-US', {
                weekday: 'short', month: 'numeric', day: 'numeric'
            });
            return dayLabel;
        })
        : [];

    return (
        <aside className="bg-gray-800 text-white w-64 p-4 flex flex-col gap-6 h-screen">
            <div className="flex items-center gap-2 text-lg font-bold">
                <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center">Logo</div>
                <span className="text-xl">Aniway</span>
            </div>
            <nav className="flex flex-col gap-2">
                <button className="text-left py-2 px-3 rounded bg-white text-black font-semibold shadow-inner">➤ Overview</button>
                <button className="text-left py-2 px-3 rounded bg-orange-500 font-semibold">Smart Assistant</button>
                <button className="text-left py-2 px-3 rounded font-semibold">🗺️ Itinerary</button>
            </nav>
            <div className="flex flex-col gap-1 text-sm text-gray-300">
                {dates.map((label, index) => (
                    <div key={index} className="hover:text-white cursor-pointer">{label}</div>
                ))}
            </div>
            <button className="mt-auto bg-orange-400 text-black rounded-full py-2 px-4 font-semibold hover:bg-orange-300">
                Send this plan via email
            </button>
        </aside>
    );
}

