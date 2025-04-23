import { useEffect, useState } from "react";
import axios from "axios";

function DisplayPopLocInfo({ sectionTitle, locList }) {
  const [locationImages, setLocationImages] = useState({});

  useEffect(() => {
    // Keep track of URLs created in this specific effect run
    let currentObjectUrls = [];

    const fetchImages = async () => {
      if (!locList || locList.length === 0) {
        setLocationImages({});
        return;
      }

      const results = await Promise.allSettled(
        locList.map(async (loc) => {
          try {
            const placeResponse = await axios.post("/api/gmap/", {
              lat: loc.lat,
              lng: loc.lng,
            });
            const placeData = placeResponse.data;

            if (placeData && placeData.photo_reference) {
              const photoResponse = await axios.post(
                "/api/gmap/photo",
                { photo_reference: placeData.photo_reference },
                { responseType: "blob" }
              );
              const photoBlob = photoResponse.data;

              const url = URL.createObjectURL(photoBlob);
              currentObjectUrls.push(url);
              return { id: loc.id, url: url };
            } else {
              return null;
            }
          } catch (err) {
            console.error(
              `Error processing location ${loc.id}:`,
              err.response
                ? `${err.response.status} ${err.response.statusText}`
                : err.message
            );
            return null;
          }
        })
      );

      // Simplify state update using filter and reduce
      const newMapImages = results.reduce((acc, result, index) => {
        // Check if the promise was fulfilled and returned a valid URL object
        if (result.status === "fulfilled" && result.value?.url) {
          acc[locList[index].id] = result.value.url;
        } else if (result.status === "rejected") {
          // Log rejected promises (optional, but good for debugging)
          console.warn(
            `Image fetch failed for location ${locList[index].id}:`,
            result.reason
          );
        }
        return acc;
      }, {}); // Start with an empty object accumulator

      setLocationImages(newMapImages);
    };

    // Reset state if locList becomes empty
    if (!locList || locList.length === 0) {
      setLocationImages({});
      return () => {};
    }

    fetchImages();

    // Cleanup function: Revokes only the URLs created in *this* effect run
    return () => {
      currentObjectUrls.forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
      // Clear the array for the next run (though technically not needed as it's scoped)
      currentObjectUrls = [];
    };
    // Only re-run the effect if locList changes
  }, [locList]);

  return (
    <>
      <h2 className="text-3xl font-extrabold tracking-wide flex items-center mb-6">
        {sectionTitle}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-8">
        {locList.map((data) => (
          <div
            key={data.id}
            className="relative bg-white rounded-lg overflow-hidden shadow-md  object-cover transition-transform duration-300 ease-in-out transform hover:scale-105"
          >
            <img
              src={locationImages[data.id] || "/default-image.jpg"}
              alt={data.name}
              className="w-full h-60 object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default-image.jpg";
              }}
            />

            <div className="p-2">
              <h3 className="text-lg font-bold truncate">{data.name}</h3>
              {data.addresses ? (
                <p className="text-sm text-gray-500 truncate whitespace-normal break-words">
                  {data.addresses[0]}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Address not available
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default DisplayPopLocInfo;
