import dayjs from 'dayjs';


export function extendTripDate(sortedTripData) {
    if (sortedTripData.length === 0) return [];

    const startDate = dayjs(sortedTripData[0].date);
    const endDate = dayjs(sortedTripData[sortedTripData.length - 1].date);
    //create a new array with the length of the date range
    const newTripData = Array.from({ length: endDate.diff(startDate, 'day') + 1 });

    return newTripData.map((_, index) => {
        // Create a new date string for each index
        const currentDateStr = startDate.add(index, 'day').format('YYYY-MM-DD');
        // Check if the current date exists in the sortedTripData
        const existingDay = sortedTripData.find(d => d.date === currentDateStr);
        return {
            // Create a new day object with the current date if it doesn't exist
            ...(existingDay || { date: currentDateStr, itinerary: [] }),
            index: index // Ensure the index is set correctly
        };
    });
}