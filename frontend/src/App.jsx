import { useContext } from "react";
import { Route, Routes } from "react-router-dom";
import { LoadScript } from "@react-google-maps/api";
import HomePage from "./pages/Home/HomePage";
import TripPlanner from "./pages/TripPlanner/TripPlanner";
import LocationsSearchPage from "./pages/Locations/LocationsSearchPage";
import AniDetail from "./pages/Anime/Anime";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Setting from "./pages/Setting/Setting";
import ProfilePage from "./pages/Profile/ProfilePage";
import LoginPage from "./pages/Login/Login";
import MainLayout from "./components/Layout/MainLayout";
import AboutPage from "./pages/About/About";
import ReferencePage from "./pages/Reference/Reference";
import ContactPage from "./pages/Contact/Contact";
import ConfirmModal from "./components/Modal/ConfirmModal";
import SuccessMessageToast from "./components/Modal/SuccessMessageToast.jsx";
import AnimeSearchPage from "./pages/Anime/AnimeSearchPage.jsx";
import { AppContext } from "./context/AppContext";

import "./App.css";

const googleMapsLibraries = ["places"]; // Define libraries array as a constant here

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const {
    isConfirmModalOpen,
    confirmModalConfig,
    hideConfirmModal,
    isSuccessToastOpen,
    successToastMessage,
    hideSuccessToast,
  } = useContext(AppContext);

  if (!apiKey) {
    console.error(
      "Google Maps API key is missing. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file."
    );
    // Optionally render an error message or fallback UI
    return <div>Error: Google Maps API Key is not configured.</div>;
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={googleMapsLibraries}>
      <DndProvider backend={HTML5Backend}>
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          onConfirm={confirmModalConfig.onConfirm}
          onClose={hideConfirmModal}
          // confirmButtonText={confirmModalConfig.confirmText}
          // cancelButtonText={confirmModalConfig.cancelText}
        />
        {isSuccessToastOpen && (
          <SuccessMessageToast
            message={successToastMessage}
            onClose={hideSuccessToast}
          />
        )}
        <Routes>
          {/* Routes that should have NavBar and Footer, wrapped by MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/tripplanner" element={<TripPlanner />} />
            <Route path="/locations/search" element={<LocationsSearchPage />} />
            <Route path="/anime/search" element={<AnimeSearchPage />} />
            <Route path="/anime/:id" element={<AniDetail />} />
            <Route path="/profile/:userId/setting" element={<Setting />} />
            <Route path="/create-trip" element={<TripPlanner />} />
            <Route path="/trip/:tripId" element={<TripPlanner />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="reference" element={<ReferencePage />} />
            <Route path="contact" element={<ContactPage />} />
          </Route>

          {/* Routes without NavBar and Footer (e.g., LoginPage) */}
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </DndProvider>
    </LoadScript>
  );
}

export default App;
