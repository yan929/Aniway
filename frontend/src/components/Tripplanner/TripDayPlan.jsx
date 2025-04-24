import React from "react";
import dayjs

    from "dayjs";
export default function TripDayPlan({ day, index }) {
    return (
        <>
            <div className="flex items-center gap-6 text-[1.375rem] font-semibold text-gray-800">
                <span>Day {index + 1}</span>
                <span>{dayjs(day.date).format('dddd, MMMM D')}</span>

            </div>
            <div className="flex flex-col gap-2 mt-4 text-[1.375rem] font-semibold text-gray-800">
                {day.itinerary.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-2">
                        {/* <span className="text-gray-600">{item.gpPlaceId}</span> */}
                        <div className="flex items-start bg-gray-100 rounded-xl shadow-sm overflow-hidden w-full max-w-2xl">
                            {/* Left info section */}
                            <div className="flex-1 p-4 relative">
                                {/* index */}
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-green-500 text-white text-sm rounded-full flex items-center justify-center z-10 shadow">
                                    {itemIndex + 1}
                                </div>


                                {/* Title * Description */}
                                <div className="pl-4 pr-2">
                                    <h3 className="text-lg font-bold text-gray-700 text-left">{item.gpPlaceId} Location title</h3>
                                    <p className="text-sm text-gray-700 text-left">{item.gpPlaceId} description</p>
                                </div>
                            </div>

                            {/* right side img section */}
                            <div className="w-32 h-24 flex-shrink-0">
                                <img
                                    src="https://via.placeholder.com/128x96"
                                    alt="Place"
                                    className="object-cover w-full h-full rounded-r-xl"
                                />
                            </div>
                        </div>

                    </div>
                ))}
            </div>
        </>
    );
}