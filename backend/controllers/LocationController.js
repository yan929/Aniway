// controllers/LocationController.js
import asyncHandler from "express-async-handler";
import Location from "../models/Location.js";
import { DatabaseMiddleware } from "../middleware/DatabaseMiddleware.js";

const getAllLocations = asyncHandler(async (req, res) => {
  const locations = await Location.find({ isValid: true }); // Filter only valid locations
  res.json(locations);
});

const addLocation = asyncHandler(async (req, res) => {
  const {
    name,
    name_cn,
    lat_precise,
    lng_precise /* other Location fields */,
  } = req.body;
  const location = new Location({
    name,
    name_cn,
    lat_precise,
    lng_precise /* ... */,
  });
  const saved = await location.save();
  res.status(201).json(saved);
});

const updateLocation = asyncHandler(async (req, res) => {
  try {
    const updated = await Location.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      overwrite: true,
    });
    if (!updated)
      return res.status(404).json({ message: "Location not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating location:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

const partialUpdateLocation = asyncHandler(async (req, res) => {
  try {
    const updated = await Location.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ message: "Location not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error partially updating location:", err);
    res.status(500).json({ error: "Partial update failed" });
  }
});

const deleteLocation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const location = await Location.findByIdAndDelete(id);
  if (!location) {
    return res.status(404).json({ message: "Location not found" });
  }
  res.json({ message: "Location deleted" });
});

// Controller function to get distinct cities for a specific country with filtering and pagination
export const getCitiesByCountry = async (req, res) => {
  try {
    const countryName = req.params.country;
    const { q, offset: offsetQuery, limit: limitQuery } = req.query;

    const offset = parseInt(offsetQuery, 10) || 0;
    const limit = parseInt(limitQuery, 10) || 10;

    if (!countryName) {
      return res
        .status(400)
        .json({ message: "Country parameter is required." });
    }

    // Base filter: specific country, non-null/non-empty city
    const filter = {
      country: countryName,
      city: { $ne: null, $ne: "" },
    };

    // Add search query filter if 'q' is provided
    if (q) {
      filter.city = { ...filter.city, $regex: q, $options: "i" }; // Case-insensitive regex search
    }

    // Fetch distinct cities based on the filter
    const allMatchingCitiesRaw = await Location.distinct("city", filter).sort(); // Sort alphabetically

    // Explicitly filter out null values in the application code as a safeguard
    const allMatchingCities = allMatchingCitiesRaw.filter(
      (city) => city !== null
    );

    const totalCities = allMatchingCities.length;

    if (totalCities === 0) {
      const message = q
        ? `No cities found for country '${countryName}' matching query '${q}'`
        : `No cities found for country: ${countryName}`;
      return res.status(404).json({ message });
    }

    // Apply pagination to the filtered and sorted results
    const paginatedCities = allMatchingCities.slice(offset, offset + limit);

    // Always return paginated results along with total count
    res.status(200).json({
      cities: paginatedCities,
      totalCities: totalCities,
      offset,
      limit,
    });
  } catch (error) {
    console.error(
      `Error fetching cities for country ${req.params.country}:`,
      error
    );
    res
      .status(500)
      .json({ message: "Server error fetching cities", error: error.message });
  }
};

const getLocationByAnime = async (req, res) => {
  const { animeName } = req.params;
  const response = await DatabaseMiddleware.queryForLocationsByAnimeName(
    animeName
  );
  return response;
};

export {
  getAllLocations,
  getLocationByAnime,
  addLocation,
  updateLocation,
  partialUpdateLocation,
  deleteLocation,
};

// New Service Function to fetch relevant locations
export const searchRelevantLocationsService = async (extractedInfo) => {
  console.log(
    "LocationService: Fetching relevant places based on:",
    extractedInfo
  );

  const { destination, interests } = extractedInfo || {}; // Handle undefined extractedInfo

  // Basic validation
  if (!destination && (!interests || interests.length === 0)) {
    console.log("LocationService: No destination or interests provided.");
    return [];
  }

  const queryConditions = [];

  // Add destination condition if provided
  if (destination) {
    const destinationRegex = new RegExp(destination.trim(), "i"); // Case-insensitive
    queryConditions.push({ addresses: { $regex: destinationRegex } });
  }

  // Add interests condition if provided
  if (interests && interests.length > 0) {
    const interestRegexes = interests.map(
      (interest) => new RegExp(interest.trim(), "i")
    );
    // Assuming interests are related to anime names as in the original function
    queryConditions.push({
      $or: [
        { anime_names: { $in: interestRegexes } },
        { anime_en_names: { $in: interestRegexes } },
        { anime_cn_names: { $in: interestRegexes } },
      ],
    });
  }

  // Combine conditions using $and if multiple conditions exist
  const query =
    queryConditions.length > 1
      ? { $and: queryConditions }
      : queryConditions.length === 1
      ? queryConditions[0]
      : {};

  let places = [];
  try {
    const locations = await Location.find(query)
      .select(
        "name country city anime_names anime_cn_names anime_en_names images addresses lat lng" // Added name
      )
      .limit(10); // Keep the limit for now, can be parameterized later

    places = locations.map((loc) => ({
      id: loc._id,
      name: loc.name, // Ensure name is included
      lat: loc.lat,
      lng: loc.lng,
      addresses: loc.addresses,
      country: loc.country,
      city: loc.city,
      images: loc.images,
      anime_names: loc.anime_names,
      anime_cn_names: loc.anime_cn_names,
      anime_en_names: loc.anime_en_names,
    }));
  } catch (error) {
    console.error("LocationService: Error fetching relevant places:", error);
    return []; // Return empty array on error
  }

  console.log(
    `LocationService: Found ${
      places.length
    } places matching query for destination: '${destination}', interests: '${interests?.join(
      ", "
    )}'`
  );
  return places;
};

// New API Handler Function
export const searchRelevantLocationsApi = asyncHandler(async (req, res) => {
  const { destination, interests: interestsQuery } = req.query;

  // Interests might come as a comma-separated string from query params
  const interests = interestsQuery ? interestsQuery.split(",") : [];

  if (!destination && interests.length === 0) {
    return res.status(400).json({
      message: "Please provide a destination or at least one interest.",
    });
  }

  try {
    const places = await searchRelevantLocationsService({
      destination,
      interests,
    });
    if (places.length === 0) {
      return res.status(404).json({
        message: "No relevant locations found matching your criteria.",
      });
    }
    res.status(200).json(places);
  } catch (error) {
    console.error("API Error fetching relevant locations:", error);
    res
      .status(500)
      .json({ message: "Server error fetching relevant locations." });
  }
});
