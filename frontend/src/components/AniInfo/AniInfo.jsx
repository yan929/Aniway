function DisplayDetailAniInfo({ aniData }) {
  return (
    <>
      {/* Top Section */}
      <div className="relative w-full h-auto overflow-hidden">
        {/* section bg */}
        <img
          src={aniData.images?.small ?? aniData.cover}
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
              "bg-white/10 text-black dark:bg-gray-800/30 dark:text-gray-200 backdrop-blur-md p-6 max-w-3xl h-full rounded-md text-left"
            }
          >
            <h1 className="text-3xl font-bold mb-4 dark:text-white">
              {aniData.name}
            </h1>
            <div className="mt-4">
              <h4 className="text-lg font-semibold mb-1 dark:text-gray-100">
                Description
              </h4>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {aniData.description}
              </p>
            </div>
            <div className="mt-4">
              {aniData.director ||
              aniData.site ||
              (aniData.copyrights && aniData.copyrights.length > 0) ? (
                <>
                  <h4 className="text-lg font-semibold mb-1 dark:text-gray-100">
                    Production Information
                  </h4>
                  {aniData.director && (
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      Director: {aniData.director}
                    </p>
                  )}
                  {aniData.site && (
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      Site:{" "}
                      <a
                        href={aniData.site}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline dark:text-blue-400"
                      >
                        {aniData.site}
                      </a>
                    </p>
                  )}
                  {aniData.copyrights &&
                    aniData.copyrights.map((copyright, index) => (
                      <p
                        key={index}
                        className="text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                      >
                        {copyright}
                      </p>
                    ))}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DisplayDetailAniInfo;
