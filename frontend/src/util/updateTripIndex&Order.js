// export function updateTripIndexAndOrder(tripData) {
//     // Check if tripData is empty
//     if (tripData.length === 0) {
//         console.log('updateTripIndexAndOrder:Trip data is empty. Returning an empty array.');
//         return tripData;
//     }

//     // Sort the trip data by date
//     const sortedTripData = tripData.sort((a, b) => new Date(a.date) - new Date(b.date));

//     console.log('Sorted trip data:', sortedTripData);

//     const clearIndexTripdate = sortedTripData.map((day, index) => ({
//         ...day,
//         index: 0,
//     }));
//     // Update the index and order of the trip data
//     const updatedTripData = clearIndexTripdate.map((day, index) => ({
//         ...day,
//         index: index,
//     }));

//     console.log('Updated trip data:', updatedTripData);

//     return updatedTripData;
// }
import dayjs from 'dayjs';

export function updateTripIndexAndOrder(tripData) {
    if (tripData.length === 0) return [];

    // 按日期排序（确保无残留）
    const sorted = [...tripData].sort((a, b) =>
        dayjs(a.date).unix() - dayjs(b.date).unix()
    );

    // 重置索引
    return sorted.map((day, index) => ({
        ...day,
        index: index // 确保从0开始连续
    }));
}