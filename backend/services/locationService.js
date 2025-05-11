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


function createSearchRegexFromString(inputString) {
  if (!inputString || inputString.trim() === "") return null;
  const keywords = inputString.trim().split(/\s+/);
  // Escape special regex characters for each keyword and join with OR operator '|'
  const regexPattern = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|");
  return new RegExp(regexPattern, "i"); // Case-insensitive
}

// Helper to consistently format the location output object based on Anime.location subdocument structure
function formatAnimeLocationObject(locSubDoc, animeDoc) {
  return {
    id: locSubDoc.id,                         // e.g., "5c4dgq9t5"
    name: locSubDoc.name,                     // e.g., "「CLANNAD」DVD: 第8巻 表紙"
    image: locSubDoc.image,
    ep: locSubDoc.ep,
    s: locSubDoc.s,
    origin: locSubDoc.origin,
    originURL: locSubDoc.originURL,
    locationRef: locSubDoc.locationRef?.toString(),
    lat: locSubDoc.lat,
    lng: locSubDoc.lng,
    addresses: locSubDoc.addresses || [],
    anitabi_names: locSubDoc.anitabi_names || [],
    anitabi_cn_names: locSubDoc.anitabi_cn_names || [],
    animeName: animeDoc.name_en || animeDoc.name || animeDoc.name_cn,
    animeId: animeDoc._id?.toString(),
  };
}

const escapeRegexChars = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


export async function searchRawLocationDataByLocateAnime(locationKeywords = [], themeKeywords = []) {
  const hasLocation = Array.isArray(locationKeywords) && locationKeywords.length > 0;
  const hasTheme = Array.isArray(themeKeywords) && themeKeywords.length > 0;


  if (!hasTheme) {
    return [];
    console.log("No theme keywords provided.");
  }

  // Create regex for theme keywords. This is always needed if hasTheme is true.
  // Joins escaped keywords with "|" for an OR condition, case-insensitive.
  const themeRegexPattern = themeKeywords.map(escapeRegexChars).join("|");
  const themeRegex = new RegExp(themeRegexPattern, "i");

  // Prepare anime query based on themeKeywords
  const animeQuery = {
    $or: [
      { name: themeRegex },
      { name_en: themeRegex },
      { name_cn: themeRegex },
    ]
  };

  // Fetch animes matching the theme keywords
  const animes = await Anime.find(animeQuery)
    .select("_id name name_en name_cn locations") // Select fields needed for output and filtering
    .lean(); // Use lean() for performance

  let matchedLocations = [];

  // Create regex for location keywords only if they are provided
  const locationRegex = hasLocation
    ? new RegExp(locationKeywords.map(escapeRegexChars).join("|"), "i")
    : null;

  for (const anime of animes) {
    let locationsToConsider = anime.locations || [];

    // If locationKeywords are provided, filter the locations from the current anime
    if (hasLocation && locationRegex) {
      locationsToConsider = locationsToConsider.filter((loc) => {
        // Check against the location's own name and its addresses array
        const nameMatch = loc.name && locationRegex.test(loc.name);
        const addressMatch = loc.addresses?.some(addr => locationRegex.test(addr));
        return nameMatch || addressMatch;
      });
    }
    // If !hasLocation (but hasTheme is true), all locationsToConsider from this anime will be processed.

    // Map the filtered/all locations to the desired output object structure
    matchedLocations.push(
      ...locationsToConsider.map(locSubDoc => ({
        // Fields from the location sub-document (locSubDoc)
        id: locSubDoc.id,                         // e.g., "5c4dgq9t5"
        name: locSubDoc.name,                     // e.g., "「CLANNAD」DVD: 第8巻 表紙"
        image: locSubDoc.image,
        ep: locSubDoc.ep,
        s: locSubDoc.s,
        origin: locSubDoc.origin,
        originURL: locSubDoc.originURL,
        locationRef: locSubDoc.locationRef?.toString(),
        lat: locSubDoc.lat,
        lng: locSubDoc.lng,
        addresses: locSubDoc.addresses || [],
        anitabi_names: locSubDoc.anitabi_names || [], // Include if present in sub-doc
        anitabi_cn_names: locSubDoc.anitabi_cn_names || [], // Include if present in sub-doc
        // Add anime information
        animeName: anime.name_en || anime.name || anime.name_cn,
        animeId: anime._id?.toString(), // Ensure anime._id is selected and converted
      }))
    );
  }

  return matchedLocations;
}