import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import dayjs from "dayjs";
function DisplayContactBanner() {
  const navigate = useNavigate();
  const selectedLocation = "Tokyo";
  const selectedDates = {
    startDate: new Date(dayjs().format("YYYY-MM-DD")),
    endDate: new Date(dayjs().add(3, "day").format("YYYY-MM-DD")),
  };

  const { setTripDetails, currentTrip, loadCurrentTrip } =
    useContext(AppContext);

  const handleNavigateTrip = () => {
    const tripTitle = `Trip for anywhere`;

    if (!currentTrip) {
      setTripDetails(selectedLocation, tripTitle, selectedDates);
    } else {
      loadCurrentTrip();
    }

    navigate("/tripplanner");
  };

  return (
    <>
      <div className="dark:bg-gray-800 bg-white text-dark py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Start Your Anime Adventure?
          </h2>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            Discover real-world locations from your favorite anime series and
            create unforgettable travel experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleNavigateTrip}
              className="bg-[#626fe3] text-white hover:bg-orange-500 font-bold py-3 px-8 rounded-lg transition-colors inline-block shadow-md hover:shadow-lg"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate("/about")}
              className="bg-transparent border-2 border-green-500 hover:bg-green-500 hover:text-white font-bold py-3 px-8 rounded-lg transition-colors inline-block"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default DisplayContactBanner;
