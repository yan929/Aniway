import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useState,useEffect } from "react";
import apiClient from "../../util/api";
import DisplayAniLoc from "../../components/AniInfo/AniLoc";
import DisplayDetailAniInfo from "../../components/AniInfo/AniInfo";
import LocationPopup from "../../components/LocationPopup/LocationPopup";

function AniDetail() {
  const { id } = useParams();
  const [animeData, setAnimeData] = useState(null);
  const [animeLocData, setAnimeLocData] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const fetchAniInfo = async () => {
    console.log("Fetching anime info for ID:", id);

    try {
      const response = await apiClient.get(`/api/anime/info/${id}`);

      const data = await response.data;

      setAnimeData(data);
    } catch (error) {
      console.error("Error fetching anime info:", error);
    }
  };

  const fetchAniLoc = async () => {
    const encodedName = encodeURIComponent(animeData.name);

    try {
      const response = await apiClient.get(
        `/api/anime/locations/${encodedName}`
      );

      if (!response) {
        console.log("Test response:", response);
      }
      const data = await response.data;

      console.log("Test data:", data);
      

      const locData = data.map((location) => ({
        ...location,
        animeName: animeData.name,
      }));

      console.log("Test locData:", locData);

      setAnimeLocData(locData);
    } catch (error) {
      console.error("Error fetching anime locations:", error);
    }
  };

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    console.log("Selected location:", location);
  };

  const handleClosePopup = () => {
    setSelectedLocation(null);
  };

  useEffect(() => {
    fetchAniInfo();
    setTimeout(() => window.scrollTo(0, 0), 0);
  }, [id]);

  useEffect(() => {
    if (animeData && animeData.name) {
      fetchAniLoc();
      setTimeout(() => window.scrollTo(0, 0), 0);
    }
  }, [animeData]);

  return (
    <>
      {animeData ? (
        <DisplayDetailAniInfo aniData={animeData} />
      ) : (
        <p>Loading...</p>
      )}

      <br />
      <br />
      {animeLocData ? (
        <DisplayAniLoc
          aniLocList={animeLocData}
          onLocationClick={handleLocationClick}
        />
      ) : (
        <p>Loading...</p>
      )}

      {selectedLocation && (
        <LocationPopup location={selectedLocation} onClose={handleClosePopup} />
      )}
    </>
  );
}

export default AniDetail;
