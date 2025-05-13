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
    try {
      const response = await apiClient.get(`/api/anime/${id}`);

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
      setAnimeLocData(data);
    } catch (error) {
      console.error("Error fetching anime locations:", error);
    }
  };

  // useEffect(() => {

  //   fetchAniInfo();
  // }, [id]);

  return (
    <>
      <Link to={"/"}>Back to home</Link>
      <button onClick={fetchAniInfo}>Fetch Anime Info</button>
      {animeData ? (
        <DisplayDetailAniInfo aniData={animeData} />
      ) : (
        <p>Loading...</p>
      )}

      <button onClick={fetchAniLoc}>Fetch Location Info</button>
      {animeLocData ? (
        <DisplayAniLoc aniLocList={animeLocData} />
      ) : (
        <p>Loading...</p>
      )}
    </>
  );
}

export default AniDetail;
