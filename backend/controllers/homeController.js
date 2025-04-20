// backend/controllers/homeController.js
const asyncHandler = require("express-async-handler");
const Anime = require("../models/Anime");
const Location = require("../models/Location");

// @desc    Get trending anime and locations for the homepage
// @route   GET /api/home/trending
// @access  Public
const getTrendingData = asyncHandler(async (req, res) => {
  const limit = 5; // Number of items to fetch for each category

  try {
    // Fetch top 5 trending anime
    const trendingAnimeData = await Anime.find()
      .sort({ search_ranking: -1 }) // Sort by ranking descending
      .limit(limit)
      .select("_id name name_cn name_en images"); // Select only needed fields for display

    // Rename fields in the anime data
    const trendingAnime = trendingAnimeData.map((anime) => ({
      id: anime._id,
      name: anime.name,
      name_cn: anime.name_cn,
      name_en: anime.name_en,
      images: anime.images,
    }));

    // Fetch top 5 trending locations
    const trendingLocationsData = await Location.find()
      .sort({ search_ranking: -1 }) // Sort by ranking descending
      .limit(limit)
      .select(
        "_id name name_cn lat_precise lng_precise gmap_formatted_addresses"
      ) // Select only needed fields
      .lean(); // Get plain JS objects

    // Rename fields in the location data
    const trendingLocations = trendingLocationsData.map((loc) => ({
      id: loc._id,
      name: loc.name,
      name_cn: loc.name_cn,
      lat: loc.lat_precise, // Rename lat_precise to lat
      lng: loc.lng_precise, // Rename lng_precise to lng
      addresses: loc.gmap_formatted_addresses,
    }));

    res.json({
      trendingAnime,
      trendingLocations,
    });
  } catch (error) {
    console.error("Error fetching trending data:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching trending data" });
  }
});

// @desc    Search anime and locations by keyword
// @route   GET /api/home/search?q=<keyword>
// @access  Public
const searchData = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const limit = 5; // Number of results per category

  if (!q) {
    return res.status(400).json({ message: "Search query 'q' is required" });
  }

  try {
    const regex = new RegExp(q, "i"); // Case-insensitive regex

    // Search Anime
    const searchAnimeData = await Anime.find({
      $or: [{ name: regex }, { name_cn: regex }, { name_en: regex }],
    })
      .limit(limit)
      .select("_id name name_cn name_en images")
      .lean();

    const searchAnime = searchAnimeData.map((anime) => ({
      id: anime._id,
      name: anime.name,
      name_cn: anime.name_cn,
      name_en: anime.name_en,
      images: anime.images,
    }));

    // Search Locations
    const searchLocationsData = await Location.find({
      $or: [
        { name: regex },
        { name_cn: regex },
        // Refined search: Match keyword within the first part (before first comma) of any address element
        {
          gmap_formatted_addresses: {
            $elemMatch: { $regex: `^[^,]*${q}[^,]*`, $options: "i" },
          },
        },
      ],
    })
      .limit(limit)
      .select(
        "_id name name_cn lat_precise lng_precise gmap_formatted_addresses"
      )
      .lean();

    const searchLocations = searchLocationsData.map((loc) => ({
      id: loc._id,
      name: loc.name,
      name_cn: loc.name_cn,
      lat: loc.lat_precise,
      lng: loc.lng_precise,
      addresses: loc.gmap_formatted_addresses,
    }));

    res.json({
      searchAnime,
      searchLocations,
    });
  } catch (error) {
    console.error("Error searching data:", error);
    res.status(500).json({ message: "Server error while searching data" });
  }
});

module.exports = {
  getTrendingData,
  searchData,
};
