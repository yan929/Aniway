import React, { useState, useEffect } from "react";
import DisplayPopAniInfo from "../../components/PopularItem/AniDataInfo";
import DisplayPopLocInfo from "../../components/PopularItem/LocDataInfo";
import SearchBar from "../../components/Search/search";

function HomePage() {
  const [aniData, setAniData] = useState([]);
  const [locData, setLocData] = useState([]);

  const baseURL = import.meta.env.VITE_BACKEND_API;

  const fetchData = async () => {
    try {
      const response = await fetch(`${baseURL}/api/home/trending`);
      if (!response) {
        throw new Error("Search fail");
      }
      const data = await response.json();

      setAniData(data.trendingAnime);
      setLocData(data.trendingLocations);
    } catch (error) {
      console.log("Error of search: ", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  return (
    <>
      <h1>Homepage</h1>

      <div className="mt-4">
        <SearchBar />
      </div>

      <DisplayPopLocInfo sectionTitle="Popular Location" locList={locData} />
      <DisplayPopAniInfo sectionTitle="Popular Animation" aniList={aniData} />
    </>
  );
}

export default HomePage;
