function DisplayDetailAniInfo({ aniData }) {
  return (
    <>
      {/* Top Section */}
      <div className="relative w-full h-auto overflow-hidden">
        {/* section bg */}
        <img
          src={aniData.images.small ?? aniData.cover}
          alt={aniData.name}
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-lg opacity-50"
        />

        {/* Content */}
        <div className="relative z-10 flex items-start gap-10 px-10 py-8">
          {/* Poster */}
          <img
            src={aniData.images.small ?? aniData.cover}
            alt={aniData.name}
            className="rounded-xl border-[6px] border-white shadow-lg w-48 h-auto"
          />
          {/* Info */}
          <div
            className={
              "bg-white/10 text-blackbackdrop-blur-md p-6 max-w-3xl h-full rounded-md text-left"
            }
          >
            <h1 className="text-3xl font-bold mb-4">{aniData.name}</h1>
            <div className="mt-4">
              <h4 className="text-lg font-semibold mb-1">Description</h4>
              <p className="text-sm leading-relaxed dark:text-gray-700">
                {aniData.description}
              </p>
            </div>
            <div className="mt-4">
              <h4 className="text-lg font-semibold mb-1">
                Production Information
              </h4>
              <p className="text-sm leading-relaxed dark:text-gray-700">
                Director: {aniData["director"]}
              </p>
              <p className="text-sm leading-relaxed dark:text-gray-700">
                Site:{" "}
                <a
                  href={aniData["site"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {aniData["site"]}
                </a>
              </p>
              <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                {/* {aniData["Copyrights"]} */}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DisplayDetailAniInfo;
