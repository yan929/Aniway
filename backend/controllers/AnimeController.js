// backend/controllers/AnimeController.js
import asyncHandler from "express-async-handler";
import Anime from "../models/Anime.js"; // Assuming Anime model exists
import Location from "../models/Location.js"; // Assuming Location model exists

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

const getAnimeInfoById = asyncHandler(async (req, res) => {
  const { anime_id } = req.params;

  if (!anime_id) {
    res.status(400);
    throw new Error("Anime ID is required");
  }

  const animeData = await Anime.findById(anime_id);
  if (!animeData) {
    res.status(404);
    throw new Error("Anime not found");
  }
  const animeInfo = {
    id: animeData._id,
    name: animeData.name_en || animeData.name || animeData.name_cn,
    images: animeData.images,
    cover: animeData.cover,
    description: animeData.overview || animeData.summary,
    director: animeData.director,
    site: animeData.site,
    // copyrights: animeData.info.copyrights,
  };
  res.json(animeInfo);
});

const getAnimeIdByName = asyncHandler(async (req, res) => {
  const { anime_name } = req.params;

  if (!anime_name) {
    res.status(400);
    throw new Error("Anime name is required");
  }

  const regex = new RegExp(anime_name, "i");

  const animeData = await Anime.findOne({
    $or: [{ name_en: regex }, { name_cn: regex }, { name: regex }],
  }).select("_id name");

  if (!animeData) {
    res.status(404);
    throw new Error("Anime not found");
  }

  res.json({ id: animeData._id });
});

const getAnimeLocation = async (req, res) => {
  const animeName = req.params.anime_name;

  const regex = new RegExp(animeName, "i");

  const anime = await Anime.find({
    $or: [{ name_en: regex }, { name_cn: regex }, { name: regex }],
  });

  if (!anime || anime.length === 0) {
    return res.status(404).json({ message: "Anime not found" });
  }

  const locationData = anime[0].locations;
  if (locationData.length === 0) {
    return res
      .status(404)
      .json({ message: "No locations found for this anime" });
  }

  const locationList = await Promise.all(
    locationData.map(async (location) => {
      const relatedAnime = await Location.findOne({
        _id: location.locationRef,
      })
        .select("_id anitabi_names  anime_cn_names anime_en_names")
        .lean();

      return {
        id: location.id,
        locationName: location.name,
        image: location.image,
        anime_en_names: relatedAnime.anime_en_names,
        addresses: location.addresses,
        ep: location.ep,
        s: location.s, // have bug
        lat: location.lat,
        lng: location.lng,
      };
    })
  );

  if (locationList && locationList.length > 0) {
    return res.status(200).json(locationList);
  } else {
    return res
      .status(404)
      .json({ message: "No locations found for this anime" });
  }
};
export {
  searchAnimeByLocation,
  getAnimeInfoById,
  getAnimeLocation,
  getAnimeIdByName,
};
