// ItineraryItem.jsx
import { useRef } from "react";
import usePlacePhoto from "../../hooks/usePlacePhoto.js";
import { useDrag, useDrop } from "react-dnd";
import { VscTrash } from "react-icons/vsc";

const ItineraryItem = ({
  item,
  detail,
  itemIndex,
  displayIndex,
  moveItem,
  onDelete,
  date,
}) => {
  const photoURL = usePlacePhoto(detail?.photos?.[0]?.photo_reference);
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: "ITINERARY_ITEM",
    hover(dragged) {
      if (dragged.index !== itemIndex) {
        moveItem(dragged.index, itemIndex);
        dragged.index = itemIndex;
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "ITINERARY_ITEM",
    item: {
      index: itemIndex,
      itemData: item,
      fromDate: date,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  const handleDelete = () => {
    if (typeof onDelete === "function") {
      onDelete(item); // pass the selected location to the parent component
    }
  };

  return (
    <div
      ref={ref}
      className={`flex items-center group ${isDragging ? "opacity-50" : ""}`}
      style={{ cursor: "move" }}
    >
      <div className="relative flex bg-white dark:bg-gray-600 rounded-xl shadow-sm overflow-visible ">
        <div className="flex-1 p-4 relative ">
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[#a1a9ef]  text-white  text-sm rounded-full flex items-center justify-center z-10 shadow-[0_0_0_10px_white] dark:shadow-[0_0_0_10px_#4b5563]">
            {displayIndex + 1}
          </div>

          <div className="pl-4 pr-2">
            <h3 className="text-lg font-bold text-gray-700 dark:text-white text-left">
              {detail?.name || item.gpPlaceId}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-200 text-left">
              {detail?.editorial_summary?.overview || detail?.formatted_address}
            </p>
          </div>
        </div>

        <div className="w-24 flex-shrink-0">
          {photoURL ? (
            <img
              src={photoURL}
              alt={detail?.name || item.gpPlaceId}
              className="object-cover w-full h-full rounded-r-xl"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-r-xl">
              <span className="text-gray-500">No Image</span>
            </div>
          )}
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 left-full ml-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <button
            className=" hover:text-red-500 text-xs p-1 border-0 dark:bg-gray-600 dark:text-white"
            onClick={() => handleDelete()}
          >
            <VscTrash className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItineraryItem;
