import { useEffect, useState } from 'react';
import { fetchPlaceDetails } from '../hooks/fetchPlaceDetail';

export default function usePlaceDetails(itinerary = []) {
    const [placeDetailsMap, setPlaceDetailsMap] = useState({});

    useEffect(() => {
        const fetchDetails = async () => {
            const newMap = {};
            for (const item of itinerary) {
                try {
                    const data = await fetchPlaceDetails(item.gpPlaceId);
                    newMap[item.gpPlaceId] = data;
                } catch (err) {
                    newMap[item.gpPlaceId] = {
                        name: 'Unknown',
                        formatted_address: 'No info',
                    };
                }
            }
            setPlaceDetailsMap(newMap);
        };

        if (itinerary.length > 0) {
            fetchDetails();
        }
    }, [itinerary]);

    return placeDetailsMap;
}
