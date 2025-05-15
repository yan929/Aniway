import React from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import NaviagteButton from "../../components/Buttons/NavigateButton";

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
        {aniList.map((data) => (
          <div
            key={data.id}
            className="relative bg-white rounded-lg overflow-hidden shadow-md transition-transform duration-300 ease-in-out transform hover:scale-105 cursor-pointer flex-none mr-3 w-40 sm:w-48 md:w-56 lg:w-64 xl:w-72 flex flex-col"
            onClick={() => {
              navigate(`/anime/${data.id}`);
            }}
          >
            {/* Maintain consistent aspect ratio */}
            <div className="relative pb-[130%]">
              <img
                src={data.images.large ?? data.cover}
                alt={data.name}
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
            </div>

            <div className="p-2 md:p-3 flex-grow dark:bg-gray-800">
              <h3 className="text-sm md:text-lg font-bold truncate dark:text-gray-200">
                {data.name}
              </h3>
              {data.description ? (
                <p className="text-xs md:text-sm text-gray-500 whitespace-normal break-words line-clamp-1 md:line-clamp-2 dark:text-gray-200">
                  {data.description}
                </p>
              ) : (
                <p className="text-xs md:text-sm text-gray-500 truncate dark:text-gray-200">
                  Description...
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default DisplayPopAniInfo;
