function AniLocCard({
  locList,
  onLocationClick,
  cardClassName,
  showMainListTitle,
}) {
  // Default to true if showMainListTitle is not explicitly passed (though SmartAdviceWindow always passes it now)
  const shouldShowTitle =
    showMainListTitle === undefined ? true : showMainListTitle;

  return (
    <>
      {shouldShowTitle && (
        <h2 className="text-3xl font-extrabold tracking-wide flex items-center mb-6 dark:text-white">
          Locations ({locList ? locList.length : 0})
        </h2>
      )}
      <div className="flex flex-col gap-4 pb-8">
        {locList.map((data) => (
          <div
            key={data.id}
            className={`flex bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md transition-transform duration-300 ease-in-out transform hover:scale-102 cursor-pointer ${
              cardClassName || "h-48"
            }`}
            onClick={() => onLocationClick && onLocationClick(data)}
          >
            {/* Left side - Image */}
            <div className="w-1/4 aspect-video">
              <img
                src={data.image || "/default-image.jpg"}
                alt={data.locationName || "Location image"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/default-image.jpg";
                }}
              />
            </div>

            {/* Right side - Information */}
            <div className="w-3/4 p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2 text-left dark:text-gray-100">
                  {data.locationName.length > 0
                    ? data.locationName
                    : "Unknown Specific Location"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 text-left">
                  {data.addresses?.[0] || "No address available"}
                </p>
                <div>
                  {data.ep && (
                    <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2 text-left">
                      Related Episode and Second: EP {data.ep}
                    </h4>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default AniLocCard;
