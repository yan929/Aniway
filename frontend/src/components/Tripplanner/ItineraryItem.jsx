// ItineraryItem.jsx
import { useRef } from "react";
import usePlacePhoto from "../../hooks/usePlacePhoto.js";
import { useDrag, useDrop } from "react-dnd";
import { VscTrash } from "react-icons/vsc";


const ItineraryItem = ({ item, detail, itemIndex, moveItem, onDelete }) => {


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
    item: { index: itemIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  const handleDelete = () => {
    if (typeof onDelete === "function") {
      onDelete(item); // pass the selected location to the parent component
    }
  }


  return (
    <div
      ref={ref}
      className={`flex p-4 items-center gap-2 group  ${isDragging ? "opacity-50" : ""
        }`}
      style={{ cursor: "move" }}
    >
      <div className="flex relative items-start bg-gray-100 rounded-xl shadow-sm overflow-visible w-full max-w-2xl ">
        <div className="flex-1 p-4 relative">
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-green-500 text-white text-sm rounded-full flex items-center justify-center z-10 shadow">
            {itemIndex + 1}
          </div>

          <div className="pl-4 pr-2">
            <h3 className="text-lg font-bold text-gray-700 text-left">
              {detail?.name || item.gpPlaceId}
            </h3>
            <p className="text-sm text-gray-700 text-left">
              {detail?.editorial_summary?.overview || detail?.formatted_address}
            </p>
          </div>
        </div>

        <div className="w-32 h-24 flex-shrink-0">
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
      </div>
      <div className=" flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-800">
        <button
          className=" hover:text-red-500 text-xs p-1 "
          onClick={() => handleDelete()}
        >
          <VscTrash className="w-5 h-5" /> </button>
      </div>

    </div>
  );
};

export default ItineraryItem;
