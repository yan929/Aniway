import { convertTripData, validateTripDates } from '../../util/convertTripData.js'; // 引入转换和验证函数


const rawTripData = [
    {
        date: '20250520',
        itinerary: [
            { title: 'Tokyo Tower', arrivalTime: '09:00' },
            { title: 'Shibuya Crossing', arrivalTime: '14:30' }
        ]
    },
    {
        date: '2025-05-21',
        itinerary: [
            { title: 'Ueno Zoo', arrivalTime: '10:00' }
        ]
    }
];

// test data
const converted = convertTripData(rawTripData);
console.log('Converted Trip Data:', converted);

// test valid date
const isValid = validateTripDates(rawTripData);
console.log('Dates Valid:', isValid);
