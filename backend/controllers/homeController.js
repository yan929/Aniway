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
      .select(
        "_id name name_cn name_en images cover overview summary locations"
      ); // Select only needed fields for display

    // Rename fields in the anime data
    const trendingAnime = trendingAnimeData.map((anime) => ({
      id: anime._id,
      name: anime.name_en || anime.name || anime.name_cn,
      images: anime.images,
      cover: anime.cover,
      locations: anime.locations,
      description: anime.overview || anime.summary,
    }));

    // Fetch top 5 trending locations
    const trendingLocationsData = await Location.find()
      .sort({ search_ranking: -1 }) // Sort by ranking descending
      .limit(limit)
      .select("_id anitabi_names lat lng addresses images") // Select only needed fields
      .lean(); // Get plain JS objects

    // Rename fields in the location data
    const trendingLocations = trendingLocationsData.map((loc) => ({
      id: loc._id,
      lat: loc.lat,
      lng: loc.lng,
      addresses: loc.addresses,
      images: loc.images,
      names: loc.anitabi_names,
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
      .select(
        "_id name name_cn name_en images cover overview summary locations"
      )
      .lean();

    const searchAnime = searchAnimeData.map((anime) => ({
      id: anime._id,
      name: anime.name_en || anime.name || anime.name_cn,
      images: anime.images,
      cover: anime.cover,
      locations: anime.locations,
      description: anime.overview || anime.summary,
    }));

    // Search Locations
    const searchLocationsData = await Location.find({
      $or: [
        { anitabi_names: regex }, // Search if any name in the array matches
        { anitabi_cn_names: regex }, // Search if any CN name matches
        // Refined search: Match keyword within the first part (before first comma) of any address element
        {
          addresses: {
            // Use the correct 'addresses' field
            $elemMatch: { $regex: `^[^,]*${q}[^,]*`, $options: "i" },
          },
        },
      ],
    })
      .limit(limit)
      .select(
        "_id anitabi_names anitabi_cn_names lat lng addresses" // Select correct fields
      )
      .lean();

    const searchLocations = searchLocationsData.map((loc) => ({
      id: loc._id,
      // Use the first name found, or provide the array if needed
      name:
        loc.anitabi_names && loc.anitabi_names.length > 0
          ? loc.anitabi_names[0]
          : "",
      name_cn:
        loc.anitabi_cn_names && loc.anitabi_cn_names.length > 0
          ? loc.anitabi_cn_names[0]
          : "",
      lat: loc.lat, // Use correct field
      lng: loc.lng, // Use correct field
      addresses: loc.addresses, // Use correct field
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
