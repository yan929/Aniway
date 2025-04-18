require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const mongoose = require("mongoose");

// Minimal Subject Schema to read locations
const subjectSchema = new mongoose.Schema(
  {
    locations: [
      {
        id: String,
        name: String,
        cn: String, // Added Chinese name field
        geo: [Number], // [lat, lng]
        _id: false, // Don't need the default subdocument ID
      },
    ],
  },
  { collection: "subjects" }
); // Explicitly set collection name
const Subject = mongoose.model("SubjectMinimal", subjectSchema); // Use a distinct model name

// Schema for the new standardized locations collection
const standardizedLocationSchema = new mongoose.Schema(
  {
    _id: String, // Use the ID of the representative original location
    name: String, // Name from the representative location
    name_cn: String, // Chinese name from the representative location
    lat_precise: Number, // Original latitude
    lng_precise: Number, // Original longitude
    lat_rounded: Number, // Latitude rounded to 2 decimal places
    lng_rounded: Number, // Longitude rounded to 2 decimal places
    original_location_ids: [String], // List of all original location IDs mapping here
  },
  {
    collection: "standardized_locations",
    timestamps: true, // Add createdAt and updatedAt timestamps
  }
);
const StandardizedLocation = mongoose.model(
  "StandardizedLocation",
  standardizedLocationSchema
);

/**
 * Rounds a number to a specified number of decimal places.
 * @param {number} num - The number to round.
 * @param {number} decimals - The number of decimal places.
 * @returns {number} - The rounded number.
 */
function roundTo(num, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI environment variable not set.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    console.log("Fetching subjects and their locations...");
    // Fetch only necessary fields
    const subjects = await Subject.find({}, "locations").lean();
    console.log(`Fetched ${subjects.length} subjects.`);

    if (subjects.length === 0) {
      console.log("No subjects found. Exiting.");
      return;
    }

    const standardizedLocationsMap = new Map();
    let totalOriginalLocations = 0;

    console.log("Processing locations and building standardization map...");
    for (const subject of subjects) {
      if (!subject.locations || subject.locations.length === 0) {
        continue;
      }
      for (const location of subject.locations) {
        if (
          !location.geo ||
          location.geo.length !== 2 ||
          location.id === null ||
          location.id === undefined
        ) {
          // console.warn(`Skipping location with invalid geo or missing id: ${JSON.stringify(location)} in subject ${subject._id}`);
          continue;
        }
        totalOriginalLocations++;

        const lat = location.geo[0];
        const lng = location.geo[1];

        // Ensure lat/lng are numbers before rounding
        if (
          typeof lat !== "number" ||
          typeof lng !== "number" ||
          isNaN(lat) ||
          isNaN(lng)
        ) {
          // console.warn(`Skipping location with non-numeric geo: ${JSON.stringify(location)} in subject ${subject._id}`);
          continue;
        }

        const latRounded = roundTo(lat, 2);
        const lngRounded = roundTo(lng, 2);
        const key = `${latRounded}_${lngRounded}`;

        if (!standardizedLocationsMap.has(key)) {
          standardizedLocationsMap.set(key, {
            representative: {
              // Store the first location encountered for this rounded coord
              id: location.id,
              name: location.name,
              cn: location.cn, // Store the Chinese name
              geo: location.geo,
            },
            allIds: [location.id], // Initialize list of original IDs
          });
        } else {
          // Add the current location's ID to the list for this rounded coordinate
          standardizedLocationsMap.get(key).allIds.push(location.id);
        }
      }
    }

    console.log(`Processed ${totalOriginalLocations} original locations.`);
    console.log(
      `Found ${standardizedLocationsMap.size} unique standardized locations based on rounded coordinates.`
    );

    if (standardizedLocationsMap.size === 0) {
      console.log("No valid locations found to standardize. Exiting.");
      return;
    }

    console.log(
      "Preparing bulk upsert operations for standardized_locations collection..."
    );
    const bulkOps = [];
    for (const [key, value] of standardizedLocationsMap.entries()) {
      const [latRoundedStr, lngRoundedStr] = key.split("_");
      const latRounded = parseFloat(latRoundedStr);
      const lngRounded = parseFloat(lngRoundedStr);

      const representative = value.representative;
      const uniqueOriginalIds = [...new Set(value.allIds)]; // Ensure uniqueness just in case

      const updateDoc = {
        _id: representative.id, // Use representative ID as the document ID
        name: representative.name,
        name_cn: representative.cn || null, // Default to null if undefined/falsy
        lat_precise: representative.geo[0],
        lng_precise: representative.geo[1],
        lat_rounded: latRounded,
        lng_rounded: lngRounded,
        // Set the full list of unique original IDs associated with this standardized location
        original_location_ids: uniqueOriginalIds,
      };

      bulkOps.push({
        updateOne: {
          filter: { _id: representative.id },
          update: { $set: updateDoc }, // Overwrite with the standardized data
          upsert: true,
        },
      });
    }

    console.log(`Executing ${bulkOps.length} bulk upsert operations...`);
    if (bulkOps.length > 0) {
      const result = await StandardizedLocation.bulkWrite(bulkOps);
      console.log("Bulk write result:", JSON.stringify(result, null, 2));
    } else {
      console.log("No operations to execute.");
    }

    console.log("Standardization process completed.");
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

main();
