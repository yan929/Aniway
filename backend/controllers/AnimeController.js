// backend/controllers/AnimeController.js
import asyncHandler from "express-async-handler";
import Anime from "../models/Anime.js"; // Assuming Anime model exists

// @desc    Search anime by location keyword
// @route   GET /api/anime/search
// @access  Public
const searchAnimeByLocation = asyncHandler(async (req, res) => {
  const keyword = req.query.q;
  const limit = req.query.limit || 10;
  const offset = req.query.offset || 0;

  if (!keyword) {
    res.status(400);
    throw new Error("Keyword query parameter is required");
  }

  // Use a case-insensitive regex for searching
  const searchRegex = new RegExp(keyword, "i");

  // Find anime where any location matches the keyword in name, name_en, or addresses
  const animeData = await Anime.find({
    locations: {
      $elemMatch: {
        $or: [{ names: searchRegex }, { addresses: searchRegex }],
      },
    },
  })
    .skip(Number(offset))
    .limit(Number(limit));

  const animeList = animeData.map((anime) => ({
    id: anime._id,
    name: anime.name_en || anime.name || anime.name_cn,
    images: anime.images,
    cover: anime.cover,
    description: anime.overview || anime.summary,
    // locations: anime.locations.map((loc) => ({
    //   id: loc._id,
    //   lat: loc.lat,
    //   lng: loc.lng,
    //   names: loc.anitabi_names,
    //   addresses: loc.addresses,
    //   images: loc.images,
    //   s: loc.s,
    //   ep: loc.ep,
    // })),
  }));

  if (animeList && animeList.length > 0) {
    res.json(animeList);
  } else {
    res.status(404);
    throw new Error("No anime found matching the location keyword");
  }
});

export { searchAnimeByLocation };
