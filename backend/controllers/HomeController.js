// backend/controllers/HomeController.js
import asyncHandler from "express-async-handler";
import Anime from "../models/Anime.js";
import Location from "../models/Location.js";

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
    const trendingLocationsData = await Location.find({ isValid: true }) // Filter valid locations
      .sort({ search_ranking: -1 }) // Sort by ranking descending
      .limit(limit)
      .select("_id anitabi_names lat lng addresses images")
      .lean(); // Get plain JS objects

    // For each location, find related anime
    const trendingLocations = await Promise.all(
      trendingLocationsData.map(async (loc) => {
        // Find anime that reference this location
        const relatedAnime = await Anime.find({
          "locations.lat": loc.lat,
          "locations.lng": loc.lng,
        })
          .select("_id name name_en name_cn")
          .limit(1) // Get just the first related anime
          .lean();

        return {
          id: loc._id,
          lat: loc.lat,
          lng: loc.lng,
          addresses: loc.addresses,
          images: loc.images,
          names: loc.anitabi_names,
          animeName:
            relatedAnime.length > 0
              ? relatedAnime[0].name_en ||
                relatedAnime[0].name ||
                relatedAnime[0].name_cn
              : null,
        };
      })
    );

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

// @desc    Search all locations by keyword without limit
// @route   GET /api/home/search/all?q=<keyword>
// @access  Public
const searchAllLocations = asyncHandler(async (req, res) => {
  const { q } = req.query;
  console.log("Search query:", q);

  if (!q) {
    return res.status(400).json({ message: "Search query 'q' is required" });
  }

  try {
    const regex = new RegExp(q, "i"); // Case-insensitive regex

    // Search Locations without limit
    const searchLocationsData = await Location.find({
      isValid: true, // Filter valid locations
      $or: [
        { anitabi_names: regex },
        { anitabi_cn_names: regex },
        {
          addresses: {
            $elemMatch: { $regex: `^[^,]*${q}[^,]*`, $options: "i" },
          },
        },
      ],
    })
      .select("_id anitabi_names anitabi_cn_names lat lng addresses images")
      .lean();

    // For each location, find related anime
    const searchLocations = await Promise.all(
      searchLocationsData.map(async (loc) => {
        // Find anime that reference this location
        const relatedAnime = await Anime.find({
          "locations.lat": loc.lat,
          "locations.lng": loc.lng,
        })
          .select("_id name name_en name_cn")
          .limit(1) // Get just the first related anime
          .lean();

        return {
          id: loc._id,
          names:
            loc.anitabi_names && loc.anitabi_names.length > 0
              ? loc.anitabi_names[0]
              : "",
          name_cn:
            loc.anitabi_cn_names && loc.anitabi_cn_names.length > 0
              ? loc.anitabi_cn_names[0]
              : "",
          lat: loc.lat,
          lng: loc.lng,
          addresses: loc.addresses || [],
          images: loc.images || [],
          animeName:
            relatedAnime.length > 0
              ? relatedAnime[0].name_en ||
                relatedAnime[0].name ||
                relatedAnime[0].name_cn
              : null,
        };
      })
    );

    const anime = await Anime.find({
      $or: [{ name_en: regex }, { name_cn: regex }, { name: regex }],
    });

    const searchAnime =
      anime && anime[0] && anime[0].locations ? anime[0].locations : [];
      
    res.json({
      searchLocations,
      searchAnime,
    });
  } catch (error) {
    console.error("Error searching all locations:", error);
    res
      .status(500)
      .json({ message: "Server error while searching all locations" });
  }
});

// Maintain other controller functions
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

    const searchAnimeLocations = searchAnimeData?.[0]?.locations
      ? searchAnimeData[0].locations
          .map((loc) => ({
            id: loc.id,
            name: loc.name,
            image: loc.image,
            lat: loc.lat,
            lng: loc.lng,
            addresses: loc.addresses,
          }))
          .slice(0, limit)
      : [];

    // Search Locations
    const searchLocationsData = await Location.find({
      isValid: true, // Filter valid locations
      $or: [
        { anitabi_names: regex },
        { anitabi_cn_names: regex },
        {
          addresses: {
            $elemMatch: { $regex: `^[^,]*${q}[^,]*`, $options: "i" },
          },
        },
      ],
    })
      .limit(limit)
      .select("_id anitabi_names anitabi_cn_names lat lng addresses")
      .lean();

    // For each location, find related anime
    const searchLocations = await Promise.all(
      searchLocationsData.map(async (loc) => {
        // Find anime that reference this location
        const relatedAnime = await Anime.find({
          "locations.lat": loc.lat,
          "locations.lng": loc.lng,
        })
          .select("_id name name_en name_cn locations")
          .limit(1) // Get just the first related anime
          .lean();
        // console.log("Test related anime:", relatedAnime[0].locations);

        const index = relatedAnime[0].locations.findIndex(
          (location) => location.lat === loc.lat && location.lng === loc.lng
        );

        return {
          id: loc._id,
          name:
            loc.anitabi_names && loc.anitabi_names.length > 0
              ? loc.anitabi_names[0]
              : "",
          name_cn:
            loc.anitabi_cn_names && loc.anitabi_cn_names.length > 0
              ? loc.anitabi_cn_names[0]
              : "",
          lat: loc.lat,
          lng: loc.lng,
          image: relatedAnime[0]?.locations[index]?.image || [],
          addresses: loc.addresses,
          animeName:
            relatedAnime.length > 0
              ? relatedAnime[0].name_en ||
                relatedAnime[0].name ||
                relatedAnime[0].name_cn
              : null,
        };
      })
    );

    res.json({
      searchAnime,
      searchAnimeLocations,
      searchLocations,
    });
  } catch (error) {
    console.error("Error searching data:", error);
    res.status(500).json({ message: "Server error while searching data" });
  }
});

// @desc    Search cities and countries specifically
// @route   GET /api/home/search/cities-countries?q=<keyword>
// @access  Public
const searchCitiesAndCountries = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: "Search query 'q' is required" });
  }

  try {
    const regex = new RegExp(q, "i"); // Case-insensitive regex

    const searchLocationsData = await Location.find({
      $or: [{ city: regex }, { country: regex }],
    })
      .select("_id city country")
      .sort({ searchRanking: -1 })
      .lean();

    let cities = new Set();
    let countries = new Set();

    searchLocationsData.forEach((loc) => {
      if (loc.city && loc.city.toLowerCase().includes(q.toLowerCase())) {
        cities.add(loc.city);
      }
      if (loc.country && loc.country.toLowerCase().includes(q.toLowerCase())) {
        countries.add(loc.country);
      }
    });

    const cityResults = Array.from(cities).sort();
    const countryResults = Array.from(countries).sort();

    res.json({
      cities: cityResults,
      countries: countryResults,
    });
  } catch (error) {
    console.error("Error searching cities and countries:", error);
    res
      .status(500)
      .json({ message: "Server error while searching cities and countries" });
  }
});

export {
  getTrendingData,
  searchData,
  searchAllLocations,
  searchCitiesAndCountries,
};
