import dayjs from 'dayjs';


export function updateTripItinerary(tripData, updateItem) {
  if (!updateItem || !updateItem.date || updateItem.index === undefined || !updateItem.gpPlaceId || updateItem.order === undefined) {
    console.error("Invalid updateItem:", updateItem);
    return tripData;
  }

  const formattedDate = dayjs(updateItem.date).format('YYYY-MM-DD');

  const updatedData = tripData.map((day) => {
    if (day.date === formattedDate) {
      const newItinerary = [...day.itinerary];

      newItinerary[updateItem.index] = {
        gpPlaceId: updateItem.gpPlaceId,
        order: updateItem.order,
        arrivalTime: updateItem.arrivalTime ?? '',
        note: updateItem.note ?? ''
      };

      return {
        ...day,
        itinerary: newItinerary
      };
    }
    return day;
  });

  const dateExists = updatedData.some(d => d.date === formattedDate);

  // if the date doesn't exist, add a new entry
  if (!dateExists) {
    updatedData.push({
      date: formattedDate,
      index: updatedData.length + 1,
      itinerary: [{
        gpPlaceId: updateItem.gpPlaceId,
        order: updateItem.order,
        arrivalTime: updateItem.arrivalTime ?? '',
        note: updateItem.note ?? ''
      }]
    });
  }

  return updatedData;
}
