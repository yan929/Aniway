import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween.js';
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
import { extendTripDate } from './extendTripDate';

export function updateTripDate(newRangeTripData) {
    console.log("💡 updateTripDate 输入值:", newRangeTripData);

    if (!Array.isArray(newRangeTripData) || newRangeTripData.length === 0) return;

    // normalize the new data by formatting the new range trip data
    const normalizedNewData = newRangeTripData.map(day => ({
        ...day,
        date: dayjs(day.date).format('YYYY-MM-DD')
    }));
    const startDate = normalizedNewData[0].date;
    const endDate = normalizedNewData[normalizedNewData.length - 1].date;

    // keep the new data within the range
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
    const extendedTrip = extendTripDate(trimmed);

    return extendedTrip;

}