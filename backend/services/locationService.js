import Location from "../models/Location.js";
import Anime from "../models/Anime.js";

/**
 * Search locations from keyword `q`
 * @param {string} q - Keyword to search
 * @returns {Promise<Array>} - Array of raw location documents
 */
export async function searchRawLocationData(q) {
  const regex = new RegExp(q, "i");

  const locations = await Location.find({
    isValid: true,
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
    .select(
      "_id anitabi_names anitabi_cn_names lat lng addresses images nearby"
    )
    .lean();

  return locations;
}

/**
 * Enrich locations with their related anime info
 * @param {Array} locations - Array of location docs
 * @returns {Promise<Array>} - Locations enriched with animeName
 */
export async function enrichLocationsWithAnime(locations) {
  const enriched = await Promise.all(
    locations.map(async (loc) => {
      const relatedAnime = await Anime.find({
        "locations.lat": loc.lat,
        "locations.lng": loc.lng,
      })
        .select("_id name name_en name_cn")
        .limit(1)
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
        nearby: loc.nearby,
        animeName:
          relatedAnime.length > 0
            ? relatedAnime[0].name_en ||
              relatedAnime[0].name ||
              relatedAnime[0].name_cn
            : null,
      };
    })
  );

  return enriched;
}
