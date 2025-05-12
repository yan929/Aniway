import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useState } from "react";
import apiClient from "../../util/api";
import DisplayAniLoc from "../../components/AniInfo/AniLoc";
import DisplayDetailAniInfo from "../../components/AniInfo/AniInfo";

function AniDetail() {
  const { id } = useParams();
  const [animeData, setAnimeData] = useState(null);
  const [animeLocData, setAnimeLocData] = useState(null);

  const fetchAniInfo = async () => {
    console.log("Fetching anime info for ID:", id);

    try {
      const response = await apiClient.get(`/api/anime/${id}`);

      const data = await response.data;

      setAnimeData(data);
    } catch (error) {
      console.error("Error fetching anime info:", error);
    }
  };

  const fetchAniLoc = async () => {
    console.log("Test data:", animeData);

    const encodedName = encodeURIComponent(animeData.name);

    try {
      const response = await apiClient.get(
        `/api/anime/locations/${encodedName}`
      );

      if (!response) {
        console.log("Test response:", response);
      }
      const data = await response.data;
      setAnimeLocData(data);
    } catch (error) {
      console.error("Error fetching anime locations:", error);
    }
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

      {animeLocData ? (
        <DisplayAniLoc aniLocList={animeLocData} />
      ) : (
        <p>Loading...</p>
      )}
    </>
  );
}

export default AniDetail;
