// scripts/12_fetchAnitabiLocations.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const mongoose = require("mongoose");
const axios = require("axios");

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI;
const ANITABI_API_TEMPLATE = process.env.ANITABI_API_ENDPOINT_TEMPLATE;
const COLLECTION_NAME = "anime";
const REQUEST_DELAY_MS = 200; // Delay between API requests (milliseconds)
const BATCH_SIZE = 50; // Process updates in batches of 50

// --- Mongoose Setup ---
const animeSchema = new mongoose.Schema(
  {},
  { strict: false, collection: COLLECTION_NAME }
);
const Anime = mongoose.model("Anime", animeSchema); // Reuse the model name

// Utility function for delaying execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAndStoreLocations() {
  if (!MONGODB_URI || !ANITABI_API_TEMPLATE) {
    console.error(
      "Error: MONGODB_URI or ANITABI_API_ENDPOINT_TEMPLATE is not defined in the .env file."
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully.");

    // --- Find documents that have an anitabiId AND are not yet processed ---
    const animeToProcess = await Anime.find({
      anitabiId: { $exists: true, $ne: null },
      anitabiLocationsProcessed: { $ne: true }, // Only fetch unprocessed
    })
      .select("anitabiId")
      .lean();
    console.log(
      `Found ${animeToProcess.length} documents with an anitabiId to process.`
    );

    if (animeToProcess.length === 0) {
      console.log("No documents require Anitabi location processing.");
      return; // Exit early if nothing to do
    }

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let markedProcessedCount = 0; // Count docs marked processed without locations
    let bulkOps = [];

    for (let i = 0; i < animeToProcess.length; i++) {
      const doc = animeToProcess[i];
      const anitabiId = doc.anitabiId;
      const apiUrl = ANITABI_API_TEMPLATE.replace("{id}", anitabiId);

      console.log(
        `[${i + 1}/${
          animeToProcess.length
        }] Fetching locations for anitabiId: ${anitabiId}...`
      );

      try {
        const response = await axios.get(apiUrl);

        // --- Check if response.data is a non-empty array ---
        const locations = response.data;
        if (Array.isArray(locations) && locations.length > 0) {
          // --- Locations found: Update locations AND mark as processed ---
          bulkOps.push({
            updateOne: {
              filter: { anitabiId: anitabiId },
              update: {
                $set: { locations: locations, anitabiLocationsProcessed: true },
              },
            },
          });
          console.log(
            `  -> Found ${locations.length} locations for anitabiId: ${anitabiId}. Added update to batch.`
          );
        } else {
          // --- No locations found: Mark as processed ONLY ---
          bulkOps.push({
            updateOne: {
              filter: { anitabiId: anitabiId },
              update: { $set: { anitabiLocationsProcessed: true } }, // Mark as processed even if no locations
            },
          });
          console.log(
            `  -> No valid location points found for anitabiId: ${anitabiId}. Added 'mark processed' to batch.`
          );
          skippedCount++; // Still count as skipped in terms of adding location data
        }
      } catch (error) {
        // --- API Error: Do NOT mark as processed, log error ---
        if (error.response) {
          // Request made and server responded with a status code out of the range of 2xx
          console.error(
            `  -> Error fetching data for anitabiId ${anitabiId}: Status ${error.response.status} - ${error.response.statusText}. Will retry later.`
          );
        } else if (error.request) {
          // The request was made but no response was received
          console.error(
            `  -> Error fetching data for anitabiId ${anitabiId}: No response received. Will retry later.`
          );
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error(
            `  -> Error setting up request for anitabiId ${anitabiId}:`,
            error.message,
            `. Will retry later.`
          );
        }
        errorCount++;
        // DO NOT add to bulkOps here, let it be retried next time
      }

      // Execute batch if it reaches BATCH_SIZE or if it's the last item
      if (bulkOps.length >= BATCH_SIZE || i === animeToProcess.length - 1) {
        if (bulkOps.length > 0) {
          console.log(`\nExecuting batch of ${bulkOps.length} operations...`);
          try {
            const result = await Anime.bulkWrite(bulkOps);
            // Estimate successful updates. Note: bulkWrite might report matched/modified counts.
            const successfulOps =
              result.modifiedCount ||
              result.upsertedCount ||
              (result.ok ? bulkOps.length : 0);
            // Estimate counts based on operations. This isn't perfect.
            // A more precise way would involve iterating bulkOps before clearing it.
            let updatesInBatch = bulkOps.filter(
              (op) => op.updateOne.update.$set.locations
            ).length;
            let markedProcessedInBatch = bulkOps.length - updatesInBatch;

            console.log(
              `  -> Batch executed. Successful operations in this batch: ${successfulOps}`
            );
            updatedCount += updatesInBatch; // Count successful location updates
            markedProcessedCount += markedProcessedInBatch; // Count successful "mark processed" updates
            bulkOps = []; // Reset batch
          } catch (bulkError) {
            console.error(
              "  -> Error executing bulk write operation:",
              bulkError
            );
            // Consider all in batch as errors for counting purposes if bulkWrite fails catastrophically
            errorCount += bulkOps.length; // Or adjust based on how you want to count bulk errors
            bulkOps = []; // Reset batch even on error
          }
        }
      }

      // Add delay before the next API request (important!)
      if (i < animeToProcess.length - 1) {
        await delay(REQUEST_DELAY_MS);
      }
    }

    console.log("\n--- Process Summary ---");
    console.log(`Total documents attempted: ${animeToProcess.length}`);
    console.log(`Successfully updated with locations: ${updatedCount}`);
    console.log(
      `Marked as processed (no locations found): ${markedProcessedCount}`
    );
    console.log(
      `Skipped (API returned no data, but processed flag set): ${skippedCount}`
    ); // This might be slightly confusing, represents the API check result
    console.log(
      `API/Batch Errors encountered (will be retried next run): ${errorCount}`
    );
  } catch (error) {
    console.error("An error occurred during the main process:", error);
  } finally {
    // Ensure mongoose disconnects only if connected
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }
  }
}

fetchAndStoreLocations();
