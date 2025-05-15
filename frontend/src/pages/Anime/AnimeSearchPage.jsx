import AniSearchBar from "../../components/Search/aniSearch";

function AnimeSearchPage() {
  return (
    <>
      {/* <AniSearchBar /> */}
      <div className="my-6 mb-8" />
      <div className="flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          🔍 Search Anime
        </h1>
        <p className="text-sm text-gray-500 text-center mb-4">
          Try searching for <em>"Your Name"</em>, <em>"Sword Art Online"</em>,
          or <em>"Oshi No Ko"</em>
        </p>
        <div className="w-full max-w-2xl">
          <AniSearchBar />
        </div>
      </div>
    </>
  );
}

export default AnimeSearchPage;
