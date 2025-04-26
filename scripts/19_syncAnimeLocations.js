// scripts/19_syncAnimeLocations.js
import mongoose from "mongoose";
import dotenv from "dotenv";
// Removed model imports, will define schemas and models locally

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const QUERY_BATCH_SIZE = 10; // How many anime to fetch at once

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not defined in .env file.");
  process.exit(1);
}

// Define minimal schemas needed for the script
const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    addresses: [String],
    anitabi_names: [String],
    anitabi_cn_names: [String],
  },
  { strict: false, collection: "locations" } // Use 'locations' collection
);

const animeSchema = new mongoose.Schema(
  {
    locations: [mongoose.Schema.Types.Mixed], // Use Mixed for flexibility during sync
  },
  { strict: false, collection: "anime" } // Use 'anime' collection
);

async function syncAnimeLocations() {
  const conn = await mongoose.createConnection(MONGODB_URI).asPromise();
  console.log(`Connected to MongoDB: ${conn.name}`);

  // Get models directly from the connection
  const Anime = conn.model("Anime", animeSchema);
  const Location = conn.model("Location", locationSchema);

  let totalAnimeProcessed = 0;
  let totalUpdatesAttempted = 0;
  let totalUpdatesSucceeded = 0;
  let page = 0;

  try {
    console.log("Starting Anime location sync based on geo coordinates...");

    while (true) {
      const skip = page * QUERY_BATCH_SIZE;
      console.log(`Fetching anime batch ${page + 1} (skip: ${skip})...`);

      // Fetch a batch of anime documents, including the locations array
      const animeBatch = await Anime.find({})
        .select("_id locations") // Select only necessary fields
        .skip(skip)
        .limit(QUERY_BATCH_SIZE)
        .lean(); // Use lean for performance

      if (animeBatch.length === 0) {
        console.log("No more anime documents found with locations to process.");
        break; // Exit the loop if no more documents
      }

      console.log(`Processing ${animeBatch.length} anime documents...`);
      let bulkOps = [];

      for (const anime of animeBatch) {
        totalAnimeProcessed++;
        if (
          !anime.locations ||
          !Array.isArray(anime.locations) ||
          anime.locations.length === 0
        ) {
          continue; // Skip if locations array is invalid or empty
        }

        let needsUpdate = false;
        const updatedLocations = [];

        for (const loc of anime.locations) {
          // Validate the geo field in the current location object
          if (
            !loc.geo ||
            !Array.isArray(loc.geo) ||
            loc.geo.length !== 2 ||
            typeof loc.geo[0] !== "number" ||
            typeof loc.geo[1] !== "number"
          ) {
            // console.warn(`Skipping location with invalid geo data in anime ${anime._id}, location:`, loc);
            continue;
          }

          const lat = loc.geo[0];
          const lng = loc.geo[1];

          try {
            // Find the corresponding Location document using lat/lng
            const foundLocation = await Location.findOne({ lat, lng })
              .select("_id lat lng addresses anitabi_names anitabi_cn_names") // Select needed fields
              .lean();

            if (foundLocation) {
              needsUpdate = true; // Mark that an update is needed
              // Merge existing loc data with new data from foundLocation
              const mergedLocation = {
                ...loc, // Keep existing fields like s, ep, name, image etc.
                locationRef: foundLocation._id,
                lat: foundLocation.lat, // Overwrite lat/lng with the canonical ones from Location doc
                lng: foundLocation.lng,
                addresses: foundLocation.addresses || [], // Add/overwrite addresses
                anitabi_names: foundLocation.anitabi_names || [], // Add/overwrite anitabi_names
                anitabi_cn_names: foundLocation.anitabi_cn_names || [], // Add/overwrite anitabi_cn_names
              };
              delete mergedLocation.geo; // Remove original geo field
              updatedLocations.push(mergedLocation);
            } else {
              // If no matching Location doc found, keep the original location object as is
              updatedLocations.push(loc);
              console.warn(
                `Warning: Location not found in Location collection for coords [${lat}, ${lng}] referenced by anime ${anime._id}. Keeping original location data.`
              );
            }
          } catch (findError) {
            console.error(
              `Error finding location for coords [${lat}, ${lng}] in anime ${anime._id}:`,
              findError
            );
          }
        }

        // Only add update operation if we found matching locations and created an updated array
        if (needsUpdate && updatedLocations.length > 0) {
          totalUpdatesAttempted++;
          bulkOps.push({
            updateOne: {
              filter: { _id: anime._id },
              update: { $set: { locations: updatedLocations } },
            },
          });
        }
      } // End loop for anime in batch

      // Execute bulk write if there are operations
      if (bulkOps.length > 0) {
        console.log(`Executing batch of ${bulkOps.length} updates...`);
        try {
          const result = await Anime.bulkWrite(bulkOps, { ordered: false });
          const modifiedCount = result.modifiedCount || 0;
          console.log(
            ` -> Batch update result: Matched: ${result.matchedCount}, Modified: ${modifiedCount}`
          );
          totalUpdatesSucceeded += modifiedCount;
          if (result.hasWriteErrors()) {
            console.warn(
              ` -> Batch encountered write errors:`,
              result.getWriteErrors()
            );
          }
        } catch (bulkWriteError) {
          console.error(` -> Error during bulk write:`, bulkWriteError);
        }
      }

      page++; // Move to the next page

      // Optional: Add a small delay between batches if needed
      // await new Promise(resolve => setTimeout(resolve, 500));
    } // End while loop

    console.log(`\n--- Sync Summary ---`);
    console.log(`Total anime documents processed: ${totalAnimeProcessed}`);
    console.log(`Total update operations attempted: ${totalUpdatesAttempted}`);
    console.log(
      `Total successful location updates performed: ${totalUpdatesSucceeded}`
    );
  } catch (error) {
    console.error("\nAn error occurred during the sync process:", error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      // Check connection state before disconnecting
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB.");
    }
  }
}

// Note: This script now defines minimal schemas internally.
// Ensure the target 'anime' collection's schema can accommodate the updated
// 'locations' structure: { locationRef: ObjectId, lat: Number, lng: Number, ... }
// If the schema is strict, the $set operation might fail validation.

console.log("Starting Anime location sync script...");
syncAnimeLocations();
