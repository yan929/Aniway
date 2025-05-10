import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { use, useEffect, useState } from "react";
import apiClient from "../../util/api";
import DisplayAniLoc from "../../components/AniInfo/AniLoc";
import DisplayDetailAniInfo from "../../components/AniInfo/AniInfo";

function AniDetail() {
  const { id } = useParams();
  const [animeData, setAnimeData] = useState(null);
  const [animeLocData, setAnimeLocData] = useState(null);

  console.log("Test id:", id);

  const fetchAniInfo = async () => {
    console.log("Test fetchAniInfo");

    try {
      // const response = await apiClient.get(`/api/anime/${id}`);

      const response = await apiClient.get(`/api/anime/${id}`);

      console.log("Test response:", response);

      const data = await response.data;
      console.log("Test data:", data);

      setAnimeData(data);
    } catch (error) {
      console.error("Error fetching anime info:", error);
    }
  };

  const fetchAniLoc = async () => {
    console.log("Test fetchAniLoc");
    const encodedName = encodeURIComponent(animeData.name);
    console.log("Test encodedName:", encodedName);

    try {
      const response = await apiClient.get(
        `/api/locations/searchByAnimeName/${encodedName}`
      );

      if (!response) {
        console.log("Test response:", response);
      }
      const data = await response.data;
      setAnimeLocData(data);
      console.log("Test data:", data);
    } catch (error) {
      console.error("Error fetching anime locations:", error);
    }
  };

  // useEffect(() => {

  //   fetchAniInfo();
  // }, [id]);

  console.log("Test animeData:", animeData);

  return (
    <>
      <div>
        <Link to={"/"}>Back to home</Link>
        <br />
        <h2>This is anime</h2>
        <br />
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

        {/* More info will be added after api is added~ */}
      </div>
    </>
  );
}

export default AniDetail;
