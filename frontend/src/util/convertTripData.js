import dayjs from 'dayjs';
/**
 * Validate if all dates in trip data are valid.
 * @param {Array} tripData
 * @returns {Boolean}
 */
export function validateTripDates(tripData) {
    return tripData.every(day => dayjs(day.date, 'YYYY-MM-DD').isValid());
}
