import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import DisplayPopLocInfo from "../../components/PopularItem/LocDataInfo";

function LocationsSearchPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const baseURL = import.meta.env.VITE_BACKEND_API;

  useEffect(() => {
    const fetchAllLocations = async () => {
      if (!searchQuery.trim()) {
        setLocations([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${baseURL}/api/home/search?q=${searchQuery}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch locations");
        }
        
        const data = await response.json();
        setLocations(data.searchLocations || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching locations:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAllLocations();
  }, [searchQuery, baseURL]);

  return (
    <div className="p-5 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col gap-2.5">
        <Link to="/" className="inline-flex items-center gap-2 text-blue-500 no-underline text-base mb-2.5 hover:underline">
          <FaArrowLeft /> Back to Home
        </Link>
        <h1 className="text-4xl font-bold">Locations for "{searchQuery}"</h1>
      </header>

      {loading ? (
        <div className="text-center py-10 text-gray-600 text-base">Loading locations...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-500 text-base">Error: {error}</div>
      ) : locations.length > 0 ? (
        <DisplayPopLocInfo sectionTitle="Search Results" locList={locations} />
      ) : (
        <div className="text-center py-10 text-gray-600 text-base">
          <p>No locations found for "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}

export default LocationsSearchPage;