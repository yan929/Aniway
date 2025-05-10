import dayjs from 'dayjs';

export function updateTripItinerary(tripData, updateItem) {
    if (!Array.isArray(tripData)) {
        console.error("Invalid tripData (not an array)");
        return [];
    }

    if (!updateItem || !updateItem.date || !updateItem.gpPlaceId || updateItem.order === undefined) {
        console.error("Invalid updateItem:", updateItem);
        return tripData;
    }

    const formattedDate = dayjs(updateItem.date).format('YYYY-MM-DD');

    // copy tripData to avoid mutating the original data
    let updatedData = tripData.map(day => ({
        ...day,
        itinerary: [...day.itinerary]
    }));

    // try to find the target date
    const targetDayIndex = updatedData.findIndex(day => day.date === formattedDate);

    //if the target day index is -1, it means the date is not in the trip data
    if (targetDayIndex !== -1) {
        // update existing date item
        const targetDay = updatedData[targetDayIndex];
        const newItinerary = [...targetDay.itinerary];


        // dynamically calculate order (example: append to the end)
        const newOrder = newItinerary.length + 1;
        newItinerary.push({
            gpPlaceId: updateItem.gpPlaceId,
            order: newOrder,
            arrivalTime: updateItem.arrivalTime ?? '',
            note: updateItem.note ?? ''
        });

        updatedData[targetDayIndex] = {
            ...targetDay,
            itinerary: newItinerary
        };
    } else {
        // add new date item
        updatedData.push({
            date: formattedDate,
            index: updatedData.length, // correctly set the index
            itinerary: [{
                gpPlaceId: updateItem.gpPlaceId,
                order: 1, // new date item starts with order 1
                arrivalTime: updateItem.arrivalTime ?? '',
                note: updateItem.note ?? ''
            }]
        });
    }


    // Sort by date and reset index
    const sortedData = updatedData
        .sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix())
        .map((day, index) => ({ ...day, index }));

    return sortedData;
}