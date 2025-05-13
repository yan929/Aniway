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

const escapeRegexChars = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&');


export async function searchRawLocationDataByLocateAnime(locationKeywordsInput = [], themeKeywordsInput = []) {
  // Filter out empty or whitespace-only keywords and ensure they are strings
  const activeLocationKeywords = Array.isArray(locationKeywordsInput)
    ? locationKeywordsInput.map(k => String(k || '').trim()).filter(k => k !== "")
    : [];
  const activeThemeKeywords = Array.isArray(themeKeywordsInput)
    ? themeKeywordsInput.map(k => String(k || '').trim()).filter(k => k !== "")
    : [];

  const hasLocation = activeLocationKeywords.length > 0;
  const hasTheme = activeThemeKeywords.length > 0;

  if (!hasTheme) {
    if (hasLocation) {
      // New logic: Search only by locationKeywords from Location model, limit 50
      const locationRegexPattern = activeLocationKeywords.map(escapeRegexChars).join("|");
      const locationRegex = new RegExp(locationRegexPattern, "i");

      const foundLocations = await Location.find({
        isValid: true, // Standard filter for active locations
        $or: [
          { anitabi_names: locationRegex },
          { anitabi_cn_names: locationRegex },
          // Assumes addresses is an array of strings in the Location model
          { addresses: { $elemMatch: { $regex: locationRegex } } }
        ],
      })
        .select("_id anitabi_names anitabi_cn_names lat lng addresses images")
        .limit(50)
        .lean();

      return foundLocations.map(loc => ({
        id: loc._id.toString(), // Master Location ID
        name: loc.anitabi_names?.[0] || loc.anitabi_cn_names?.[0] || "Unknown Location",
        image: (Array.isArray(loc.images) && loc.images.length > 0) ? loc.images[0] : null,
        ep: null, // Not applicable for general location search
        s: null,  // Not applicable
        origin: null, // Not applicable
        originURL: null, // Not applicable
        locationRef: loc._id.toString(), // Refers to itself
        lat: loc.lat,
        lng: loc.lng,
        addresses: loc.addresses || [],
        anitabi_names: loc.anitabi_names || [], // From the Location doc
        anitabi_cn_names: loc.anitabi_cn_names || [], // From the Location doc
        animeName: null, // No specific anime context
        animeId: null,   // No specific anime context
      }));
    } else {
      // No effective location or theme keywords provided
      console.log("No effective location or theme keywords provided for searchRawLocationDataByLocateAnime.");
      return [];
    }
  }

  // --- Logic for theme-based search using combined Regex ---
  // This part is reached only if hasTheme is true.

  // Split keywords from the input array
  const keywords = activeThemeKeywords; // Already filtered and trimmed

  // Build an $and query with regex conditions for each keyword
  const regexConditions = keywords.map(keyword => {
    const escapedKeyword = escapeRegexChars(keyword); // Use your existing helper
    const regex = new RegExp(escapedKeyword, "i"); // Case-insensitive regex for each keyword
    // Each keyword must match in at least one of the name fields
    return {
      $or: [
        { name: regex },
        { name_en: regex },
        { name_cn: regex }
      ]
    };
  });

  let animeQuery = {};
  if (regexConditions.length > 0) {
    animeQuery = { $and: regexConditions };
  } else {
    // Should not happen if hasTheme is true, but handle defensively
    console.warn("[searchRawLocationDataByLocateAnime] No valid keywords for Regex search, returning empty.");
    return [];
  }

  console.log(`[searchRawLocationDataByLocateAnime] Using complex Regex search for anime:`, JSON.stringify(animeQuery));

  const animes = await Anime.find(animeQuery)
    .select("_id name name_en name_cn locations") // Select fields needed for output and filtering
    .lean(); // Use lean() for performance

  let matchedLocations = [];

  // Create regex for location keywords only if they are provided (and hasTheme is true)
  const locationRegex = hasLocation // hasLocation is already based on activeLocationKeywords
    ? new RegExp(activeLocationKeywords.map(escapeRegexChars).join("|"), "i")
    : null;

  for (const anime of animes) {
    let locationsToConsider = anime.locations || [];

    // If locationKeywords are provided (hasLocation is true) and we have a locationRegex,
    // filter the locations from the current anime
    if (hasLocation && locationRegex) {
      locationsToConsider = locationsToConsider.filter((loc) => {
        // Check against the location's own name and its addresses array
        const nameMatch = loc.name && locationRegex.test(loc.name);
        const addressMatch = Array.isArray(loc.addresses) && loc.addresses.some(addr => typeof addr === 'string' && locationRegex.test(addr));
        return nameMatch || addressMatch;
      });
    }
    // If !hasLocation (but hasTheme is true), all locationsToConsider from this anime will be processed.

    // Map the filtered/all locations to the desired output object structure
    // using the formatAnimeLocationObject helper or direct mapping
    matchedLocations.push(
      ...locationsToConsider.map(locSubDoc => ({
        // Fields from the location sub-document (locSubDoc)
        id: locSubDoc.id,
        name: locSubDoc.name,
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
        // Add anime information
        animeName: anime.name_en || anime.name || anime.name_cn,
        animeId: anime._id?.toString(),
      }))
    );
  }

  return matchedLocations;
}