import { useEffect, useState } from "react";
function DisplayPopLocInfo({ sectionTitle, locList }) {
  const [locationImagesList, setlocationImagesList] = useState({});
  const apiServer = import.meta.env.VITE_BACKEND_API;

  const fectchLocationImage = async () => {
    const mapImagesList = {};
    try {
      await Promise.all(
        locList.map(async (loc) => {
          try {
            console.log("Test loc: ", loc);

            const response = await fetch(apiServer + "/api/gmap/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ lat: loc.lat, lng: loc.lng }),
            });

            const data = await response.json();
            console.log("Test data: ", data);

            if (data.photo_reference) {
              const photoRes = await fetch(apiServer + "/api/gmap/photo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photo_reference: data.photo_reference }),
              });

              const blob = await photoRes.blob();
              const url = URL.createObjectURL(blob);

              if (url) {
                mapImagesList[loc.id] = url;
              }
            }
          } catch (err) {
            console.log(err);
          }
        })
      );
    } catch (error) {
      console.log(error);
    }
    setlocationImagesList(mapImagesList);
  };

  useEffect(() => {
    if (locList) {
      fectchLocationImage();
    }
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
              src={locationImagesList[data.id] || "/default-image.jpg"}
              alt={data.name}
              className="w-full h-60 object-cover"
            />

            <div className="p-2">
              <h3 className="text-lg font-bold truncate">{data.name}</h3>
              {data.addresses ? (
                <p className="text-sm text-gray-500 truncate whitespace-normal break-words">
                  {data.addresses[0]}
                </p>
              ) : (
                <p className="text-sm text-gray-500 truncate">Description...</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default DisplayPopLocInfo;
