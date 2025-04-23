import React, { useState, useEffect } from "react";
import axios from "axios";
import DisplayPopAniInfo from "../../components/PopularItem/AniDataInfo";
import DisplayPopLocInfo from "../../components/PopularItem/LocDataInfo";
import SearchBar from "../../components/Search/search";

function HomePage() {
  const [aniData, setAniData] = useState([]);
  const [locData, setLocData] = useState([]);

  useEffect(() => {
    const fetchDataOnMount = async () => {
      try {
        const response = await axios.get(`/api/home/trending`);

        const data = response.data;

        setAniData(data.trendingAnime);
        setLocData(data.trendingLocations);
      } catch (error) {
        console.error(
          "Error fetching trending data: ",
          error.response
            ? `${error.response.status} ${error.response.statusText}`
            : error.message
        );
      }
    };

    fetchDataOnMount(); // Call the inner function
  }, []); // Empty dependency array means this runs once on mount

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
