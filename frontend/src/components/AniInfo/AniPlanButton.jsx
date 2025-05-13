import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import dayjs from "dayjs";
import { AppContext } from "../../context/AppContext";
import { FaRegPaperPlane } from "react-icons/fa";
import { FaPaperPlane } from "react-icons/fa6";

function NavigatePlanButton({ animeName }) {
  const selectedLocation = "Tokyo";
  const selectedDates = {
    startDate: new Date(dayjs().format("YYYY-MM-DD")),
    endDate: new Date(dayjs().add(3, "day").format("YYYY-MM-DD")),
  };

  const navigate = useNavigate();

  const { setTripDetails } = useContext(AppContext);

  const handleNavigateTrip = () => {
    const tripTitle = `Trip for ${animeName}`;
    console.log("Test date:", selectedDates);

    setTripDetails(selectedLocation, tripTitle, selectedDates);

    navigate("/tripplanner");
  };
  return (
    <>
      <button
        onClick={handleNavigateTrip}
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-5 py-3 rounded-full shadow-xl hover:bg-blue-700 transition-all duration-200 z-50 group"
      >
        <span className="flex items-center gap-2 justify-center">

          <span className="relative w-5 h-5">
            <FaRegPaperPlane className="absolute inset-0 group-hover:opacity-0 transition-opacity duration-200" />
            {/* Hover */}
            <FaPaperPlane className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </span>

          <span className="font-semibold">Plan</span>
        </span>
      </button>
    </>
  );
}

export default NavigatePlanButton;
