import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config(); // Initialize dotenv right after imports

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI;
const BATCH_SIZE = 100; // How many locations to process in one database batch

// --- Mongoose Setup ---
// Define a schema including fields read and fields to be added/updated
const locationSchema = new mongoose.Schema(
  {
    gmap_nearby_enriched: Boolean, // Read: Ensure previous script ran
    gmap_nearby_response: mongoose.Schema.Types.Mixed, // Read: The raw nearby search response
    isValid: { type: Boolean, default: false }, // Write: Overall validity of the location
    nearby: [
      {
        // Write: Array of processed nearby places
        place_id: String,
        name: String,
        lat: Number,
        lng: Number,
        rating: Number,
        user_ratings_total: Number,
        types: [String],
        vicinity: String,
      },
    ],
    nearby_extracted: { type: Boolean, default: false }, // Write: Flag for this script
  },
  { strict: false }
); // Allow other fields not defined in schema

const Location = mongoose.model(
  "LocationNearbyExtract",
  locationSchema,
  "locations"
); // Use a different model name to avoid conflicts if schema is defined elsewhere

// --- Helper Functions ---
function processNearbyResults(nearbyResponse) {
  const extractedNearbyPlaces = [];
  let isLocationValid = false;

  if (
    !nearbyResponse ||
    nearbyResponse.status !== "OK" ||
    !Array.isArray(nearbyResponse.results)
  ) {
    return { isLocationValid, extractedNearbyPlaces };
  }

  for (const result of nearbyResponse.results) {
    const isOperational = result.business_status === "OPERATIONAL";
    const isPoiOrEstablishment =
      Array.isArray(result.types) &&
      (result.types.includes("point_of_interest") ||
        result.types.includes("establishment"));

    if (isOperational && isPoiOrEstablishment) {
      isLocationValid = true; // Mark the parent location as valid if at least one good result is found

      extractedNearbyPlaces.push({
        place_id: result.place_id,
        name: result.name,
        lat: result.geometry?.location?.lat,
        lng: result.geometry?.location?.lng,
        rating: result.rating, // Will be undefined if not present
        user_ratings_total: result.user_ratings_total, // Will be undefined if not present
        types: result.types || [],
        vicinity: result.vicinity,
      });
    }
  }

  return { isLocationValid, extractedNearbyPlaces };
}

// --- Main Execution ---
async function main() {
  if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI must be set in .env file.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalValidLocations = 0;
  let hasMore = true;
  let batchNum = 0;

  console.log("Starting Nearby Places extraction and validation process...");

  while (hasMore) {
    batchNum++;
    console.log(`--- Processing Batch ${batchNum} ---`);

    const locationsToProcess = await Location.find({
      gmap_nearby_enriched: true, // Make sure the previous step ran
      nearby_extracted: { $ne: true }, // Find locations not yet processed by this script
    }).limit(BATCH_SIZE);

    if (locationsToProcess.length === 0) {
      console.log("No more locations found to process.");
      hasMore = false;
      break;
    }

    console.log(
      `Found ${locationsToProcess.length} locations in batch ${batchNum}.`
    );
    const bulkOps = [];

    for (const loc of locationsToProcess) {
      totalProcessed++;
      const { isLocationValid, extractedNearbyPlaces } = processNearbyResults(
        loc.gmap_nearby_response
      );

      if (isLocationValid) {
        totalValidLocations++;
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: loc._id },
          update: {
            $set: {
              isValid: isLocationValid,
              nearby: extractedNearbyPlaces,
              nearby_extracted: true, // Mark as processed by this script
            },
          },
        },
      });
    }

    // Execute bulk write if there are operations
    if (bulkOps.length > 0) {
      try {
        const result = await Location.bulkWrite(bulkOps, { ordered: false });
        console.log(
          `  -> Bulk write executed. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`
        );
        totalUpdated += result.modifiedCount || 0;
      } catch (bulkWriteError) {
        console.error("  -> Error during bulk write:", bulkWriteError);
        // Decide how to handle: stop, skip batch, log and continue?
        // For now, just logging and continuing.
      }
    }

    console.log(
      `Batch ${batchNum} finished. Total processed so far: ${totalProcessed}`
    );
  }

  console.log("\n--- Extraction Summary ---");
  console.log(`Total locations processed by this script: ${totalProcessed}`);
  console.log(`Total documents updated: ${totalUpdated}`);
  console.log(`Total locations marked as isValid: ${totalValidLocations}`);
  console.log("--------------------------\n");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

main().catch((err) => {
  console.error("Unhandled error during script execution:", err);
  mongoose.disconnect();
  process.exit(1);
});
