import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { validateTripDates } from './util/convertTripData.js';
import { extendTripDate } from './util/extendTripDate.js';
import { updateTripIndexAndOrder } from './util/updateTripIndex&Order.js';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween.js';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const AppContext = React.createContext({
    tripData: null,
    loading: false,
    updateTrip: () => { },
    fetchTrip: () => { }
});

// test data
const testTripData = [
    {
        "date": "2025-10-01",
        "index": 9,
        "itinerary": [
            { "gpPlaceId": "ChIJ123123", "order": 1, "arrivalTime": "12:00", "note": "Dinner with view" },
            { "gpPlaceId": "ChIJ456456", "order": 2, "arrivalTime": "22:00", "note": "Dinner with view" }
        ]
    },
    {
        "date": "2025-10-02",
        "index": 20,
        "itinerary": [
            { "gpPlaceId": "ChIJ789789", "order": 1, "arrivalTime": "10:00", "note": "Dinner with view" }
        ]
    },
    {
        "date": "2025-10-03",
        "index": 1,
        "itinerary": [
            { "gpPlaceId": "ChIJ789789", "order": 1, "arrivalTime": "10:00", "note": "Dinner with view" }
        ]
    },
];

function AppContextProvider({ children }) {


    //initial trip data
    const [tripData, setTripData] = useState(() => {
        try {
            //   const saved = localStorage.getItem('tripData');
            //   return saved ? JSON.parse(saved) : testTripData;
            return testTripData;//testing
        } catch (e) {
            console.error("Failed to load localStorage tripData:", e);
            return testTripData;
        }
    });;


    const [loading, setLoading] = useState(false);

    //synchronize trip data to local storage
    useEffect(() => {
        if (tripData) {
            //save new data
            localStorage.setItem('tripData', JSON.stringify(tripData));
            console.log("locolStorage tripData:", localStorage.getItem('tripData'));
        }
    }, [tripData]);


    function updateTrip(newRangeTripData) {
        if (!Array.isArray(newRangeTripData) || newRangeTripData.length === 0) return;

        // 强制标准化日期并提取范围
        const normalizedNewData = newRangeTripData.map(day => ({
            ...day,
            date: dayjs(day.date).format('YYYY-MM-DD')
        }));
        const startDate = normalizedNewData[0].date;
        const endDate = normalizedNewData[normalizedNewData.length - 1].date;

        // 完全重置：仅保留新数据，不依赖旧数据
        let trimmed = [];
        normalizedNewData.forEach(newDay => {
            if (
                dayjs(newDay.date).isSameOrAfter(startDate, 'day') &&
                dayjs(newDay.date).isSameOrBefore(endDate, 'day')
            ) {
                trimmed.push(newDay);
            }
        });

        // extendTipDate will fill in the missing dates and reset the index
        // const sorted = updateTripIndexAndOrder(trimmed);
        // const extended = extendTripDate(sorted);
        const extended = extendTripDate(trimmed);

        //setTripData will update the trip data
        setTripData(extended);
        console.log("Updated trip data:", tripData);

    }



    const context = {
        tripData,
        loading,
        updateTrip
    };

    return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
}




export { AppContext, AppContextProvider };
