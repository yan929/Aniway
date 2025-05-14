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
  const regexPattern = keywords
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  return new RegExp(regexPattern, "i"); // Case-insensitive
}

// Helper to consistently format the location output object based on Anime.location subdocument structure
function formatAnimeLocationObject(locSubDoc, animeDoc) {
  return {
    id: locSubDoc.id, // e.g., "5c4dgq9t5"
    name: locSubDoc.name, // e.g., "「CLANNAD」DVD: 第8巻 表紙"
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

const escapeRegexChars = (string) =>
  string.replace(/[.*+?^${}()|[\\\]\\]/g, "\\\\$&");

// Helper function to calculate relevance score
function calculateRelevanceScore(
  locSubDoc,
  animeDoc,
  activeThemeKeywords,
  activeLocationKeywords
) {
  let score = 0;
  // Ensure keywords are strings and lowercased, filter out empty ones after trimming
  const lowerCaseThemeKeywords = activeThemeKeywords
    .map(k => String(k || "").trim().toLowerCase())
    .filter(k => k.length > 0);
  const lowerCaseLocationKeywords = activeLocationKeywords
    .map(k => String(k || "").trim().toLowerCase())
    .filter(k => k.length > 0);

  // Score based on theme keywords matching anime names
  if (animeDoc && lowerCaseThemeKeywords.length > 0) {
    const animeNameSources = [
      animeDoc.name,
      animeDoc.name_en,
      animeDoc.name_cn,
    ].filter(Boolean).map(name => String(name || "").toLowerCase()); // Ensure string

    lowerCaseThemeKeywords.forEach(themeKeyword => {
      // themeKeyword is already guaranteed to be a non-empty string here
      if (animeNameSources.some(nameSource => nameSource.includes(themeKeyword))) {
        score += 2; // Higher weight for theme/anime match
      }
    });
  }

  // Score based on location keywords matching location details
  if (lowerCaseLocationKeywords.length > 0) {
    const locationName = typeof locSubDoc.name === 'string' ? locSubDoc.name.toLowerCase() : "";
    const locationAddresses = Array.isArray(locSubDoc.addresses)
      ? locSubDoc.addresses.map(addr => String(addr || "").toLowerCase())
      : [];
    const locationAnitabiNames = Array.isArray(locSubDoc.anitabi_names)
      ? locSubDoc.anitabi_names.map(name => String(name || "").toLowerCase())
      : [];
    const locationAnitabiCnNames = Array.isArray(locSubDoc.anitabi_cn_names)
      ? locSubDoc.anitabi_cn_names.map(name => String(name || "").toLowerCase())
      : [];

    lowerCaseLocationKeywords.forEach(locKeyword => {
      // locKeyword is already guaranteed to be a non-empty string here
      if (locationName.includes(locKeyword)) {
        score += 1;
      }
      if (locationAddresses.some(addr => addr.includes(locKeyword))) {
        score += 1;
      }
      if (locationAnitabiNames.some(name => name.includes(locKeyword))) {
        score += 1;
      }
      if (locationAnitabiCnNames.some(name => name.includes(locKeyword))) {
        score += 1;
      }
    });
  }

  return score;
}

export async function searchRawLocationDataByLocateAnime(
  locationKeywordsInput = [],
  themeKeywordsInput = []
) {
  // Filter out empty or whitespace-only keywords and ensure they are strings
  const activeLocationKeywords = Array.isArray(locationKeywordsInput)
    ? locationKeywordsInput
      .map((k) => String(k || "").trim())
      .filter((k) => k !== "")
    : [];
  const activeThemeKeywords = Array.isArray(themeKeywordsInput)
    ? themeKeywordsInput
      .map((k) => String(k || "").trim())
      .filter((k) => k !== "")
    : [];

  const hasLocation = activeLocationKeywords.length > 0;
  const hasTheme = activeThemeKeywords.length > 0;

  if (!hasTheme) {
    if (hasLocation) {
      // New logic: Search only by locationKeywords from Location model, limit 50
      const locationRegexPattern = activeLocationKeywords
        .map(escapeRegexChars)
        .join("|");
      const locationRegex = new RegExp(locationRegexPattern, "i");

      const foundLocations = await Location.find({
        isValid: true, // Standard filter for active locations
        $or: [
          { anitabi_names: locationRegex },
          { anitabi_cn_names: locationRegex },
          // Assumes addresses is an array of strings in the Location model
          { addresses: { $elemMatch: { $regex: locationRegex } } },
        ],
      })
        .select("_id anitabi_names anitabi_cn_names lat lng addresses images")
        .limit(50)
        .lean();

      return foundLocations.map((loc) => ({
        id: loc._id.toString(), // Master Location ID
        name:
          loc.anitabi_names?.[0] ||
          loc.anitabi_cn_names?.[0] ||
          "Unknown Location",
        image:
          Array.isArray(loc.images) && loc.images.length > 0
            ? loc.images[0]
            : null,
        ep: null, // Not applicable for general location search
        s: null, // Not applicable
        origin: null, // Not applicable
        originURL: null, // Not applicable
        locationRef: loc._id.toString(), // Refers to itself
        lat: loc.lat,
        lng: loc.lng,
        addresses: loc.addresses || [],
        anitabi_names: loc.anitabi_names || [], // From the Location doc
        anitabi_cn_names: loc.anitabi_cn_names || [], // From the Location doc
        animeName: null, // No specific anime context
        animeId: null, // No specific anime context
      }));
    } else {
      // No effective location or theme keywords provided
      console.log(
        "No effective location or theme keywords provided for searchRawLocationDataByLocateAnime."
      );
      return [];
    }
  }

  // --- Logic for theme-based search using combined Regex ---
  // This part is reached only if hasTheme is true.

  const keywords = activeThemeKeywords;
  const animeTitleMatchConditions = keywords.map((keyword) => {
    if (!keyword) return null;
    const escapedKeyword = escapeRegexChars(keyword);
    const regex = new RegExp(escapedKeyword, "i");
    return {
      $or: [{ name: regex }, { name_en: regex }, { name_cn: regex }],
    };
  }).filter(condition => condition !== null);

  let animeQuery = {};
  if (animeTitleMatchConditions.length > 0) {
    animeQuery = { $or: animeTitleMatchConditions };
  } else {
    console.warn(
      "[searchRawLocationDataByLocateAnime] No valid theme keywords resulted in conditions for Anime search, returning empty."
    );
    return [];
  }

  console.log(
    `[searchRawLocationDataByLocateAnime] Using complex Regex search for anime with $or logic:`,
    JSON.stringify(animeQuery)
  );

  const animes = await Anime.find(animeQuery)
    .select("_id name name_en name_cn locations")
    .lean();

  let matchedLocationsWithScores = []; // Store locations with their scores

  const locationRegex = hasLocation
    ? new RegExp(activeLocationKeywords.map(escapeRegexChars).join("|"), "i")
    : null;

  for (const anime of animes) {
    let locationsToConsider = anime.locations || [];

    if (hasLocation && locationRegex) {
      locationsToConsider = locationsToConsider.filter((loc) => {
        const nameMatch = loc.name && locationRegex.test(loc.name);
        const addressMatch =
          Array.isArray(loc.addresses) &&
          loc.addresses.some(
            (addr) => typeof addr === "string" && locationRegex.test(addr)
          );
        return nameMatch || addressMatch;
      });
    }

    locationsToConsider.forEach((locSubDoc) => {
      const score = calculateRelevanceScore(
        locSubDoc,
        anime, // Pass the parent anime document
        activeThemeKeywords,
        activeLocationKeywords
      );

      if (score > 0) { // Only include locations that matched at least something for scoring
        matchedLocationsWithScores.push({
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
          animeName: anime.name_en || anime.name || anime.name_cn,
          animeId: anime._id?.toString(),
          score: score, // Add the calculated score
        });
      }
    });
  }

  // Sort locations by score in descending order
  matchedLocationsWithScores.sort((a, b) => b.score - a.score);

  // Optional: remove the score if you don't want to send it to the client
  // const sortedLocations = matchedLocationsWithScores.map(({ score, ...rest }) => rest);
  // return sortedLocations;

  return matchedLocationsWithScores; // Return with scores for now, can be removed if not needed by frontend
}
