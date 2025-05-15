import React from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import NaviagteButton from "../../components/Buttons/NavigateButton";
import AniInfoCard from "../AniInfo/AniInfoCard";

function DisplayPopAniInfo({ sectionTitle, aniList }) {
  const navigate = useNavigate();

  const handleNaviagteAnimeSearch = () => {
    navigate("/anime/search");
  };
  return (
    <>
      <div className="flex items-center mb-4 md:mb-6 dark:bg-gray-800">
        <div className="flex items-center gap-6">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide dark:text-gray-200 m-0">
            {sectionTitle}
          </h2>
          <NaviagteButton
            text={"Find more"}
            IconBeforeHover={FaSearch}
            IconAfterHover={FaSearch}
            onClick={handleNaviagteAnimeSearch}
          />
        </div>
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-200">
          ← Scroll for more →
        </span>
      </div>

      {/* Horizontal scrolling on ALL screen sizes */}
      <div className="overflow-x-auto flex -mx-4 px-4 pb-6 md:pb-8 ">
        {aniList.map((anime) => (
          <AniInfoCard data={anime} />
        ))}
      </div>
    </>
  );
}

export default DisplayPopAniInfo;
