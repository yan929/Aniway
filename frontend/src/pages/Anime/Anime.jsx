import { useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import apiClient from "../../util/api";
import DisplayAniLoc from "../../components/AniInfo/AniLoc";
import DisplayDetailAniInfo from "../../components/AniInfo/AniInfo";
import LocationPopup from "../../components/LocationPopup/LocationPopup";
import NavigatePlanButton from "../../components/AniInfo/AniPlanButton";
import LoadingImage from "../../components/Animation/Loading";
import BackToButton from "../../components/Buttons/BackToButton";

function AniDetail() {
  const { id } = useParams();
  const [animeData, setAnimeData] = useState(null);
  const [animeLocData, setAnimeLocData] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const fetchAniInfo = useCallback(async () => {
    try {
      const response = await apiClient.get(`/api/anime/info/${id}`);

      const data = await response.data;

      setAnimeData(data);
    } catch (error) {
      console.error("Error fetching anime info:", error);
    }
  }, [id]);

  const fetchAniLoc = useCallback(async () => {
    // Ensure animeData and animeData.name exist before proceeding
    if (!animeData || !animeData.name) {
      console.log(
        "fetchAniLoc: animeData or animeData.name is not available yet."
      );
      return;
    }
    const encodedName = encodeURIComponent(animeData.name);

    try {
      const response = await apiClient.get(
        `/api/anime/locations/${encodedName}`
      );

      if (!response) {
        console.log("Test response:", response);
      }
      const data = await response.data;

      const locData = data.map((location) => ({
        ...location,
        animeName: animeData.name,
      }));

      setAnimeLocData(locData);
    } catch (error) {
      console.error("Error fetching anime locations:", error);
    }
  }, [animeData]);

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
  };

  const handleClosePopup = () => {
    setSelectedLocation(null);
  };

  useEffect(() => {
    fetchAniInfo();
    setTimeout(() => window.scrollTo(0, 0), 0);
  }, [fetchAniInfo]);

  useEffect(() => {
    if (animeData && animeData.name) {
      fetchAniLoc();
      setTimeout(() => window.scrollTo(0, 0), 0);
    }
  }, [animeData, fetchAniLoc]);

  return (
    <div className="dark:bg-gray-800 min-h-screen p-4 md:p-6 lg:p-8">
      <BackToButton message={"home"} page={""} />

      <div className="mt-4 px-4" />

      {animeData ? (
        <DisplayDetailAniInfo aniData={animeData} />
      ) : (
        <LoadingImage />
      )}

      <br />
      {animeLocData ? (
        <DisplayAniLoc
          aniLocList={animeLocData}
          onLocationClick={handleLocationClick}
        />
      ) : (
        <LoadingImage />
      )}

      {selectedLocation && (
        <LocationPopup location={selectedLocation} onClose={handleClosePopup} />
      )}

      {animeData && <NavigatePlanButton animeName={animeData.name} />}
    </div>
  );
}

export default AniDetail;
