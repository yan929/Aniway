import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import DisplayPopLocInfo from "../../component/PopularItem/LocDataInfo";
import "../../layout/LocationsSearch.css";

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
    <div className="locations-search-page p-6">
      <div className="page-header mb-6">
        <Link to="/" className="back-button inline-flex items-center gap-2 text-blue-500 hover:underline">
          <FaArrowLeft /> Back to Home
        </Link>
        <h1 className="text-4xl font-bold mt-4">Locations for "{searchQuery}"</h1>
      </div>

      {loading ? (
        <div className="loading-state text-center py-10">Loading locations...</div>
      ) : error ? (
        <div className="error-state text-center py-10 text-red-500">Error: {error}</div>
      ) : locations.length > 0 ? (
        <DisplayPopLocInfo sectionTitle="Search Results" locList={locations} />
      ) : (
        <div className="no-results text-center py-10">
          <p>No locations found for "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}

export default LocationsSearchPage;