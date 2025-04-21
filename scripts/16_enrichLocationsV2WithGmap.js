// scripts/18_enrichLocationsV2WithGmap.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Client } from "@googlemaps/google-maps-services-js";

dotenv.config(); // Load environment variables from .env file

const MONGODB_URI = process.env.MONGODB_URI;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const TARGET_COLLECTION_NAME = "locations_v2";

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not defined in .env file.");
  process.exit(1);
}
if (!GOOGLE_MAPS_API_KEY) {
  console.error("Error: GOOGLE_MAPS_API_KEY is not defined in .env file.");
  process.exit(1);
}

// Target Schema (should match the one in script 17)
const locationV2Schema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    anitabi_ids: [String],
    anitabi_names: [String],
    anitabi_cn_names: [String],
    images: [String],
    origins: [String],
    originURLs: [String],
    gmap_processed: { type: Boolean, default: false, index: true }, // Index for querying
    addresses: [String], // To store Google Maps addresses
  },
  {
    collection: TARGET_COLLECTION_NAME,
    timestamps: true,
  }
);

locationV2Schema.index({ lat: 1, lng: 1 }, { unique: true });

const LocationV2 = mongoose.model("LocationV2Enrich", locationV2Schema); // Use distinct model name

const gmapsClient = new Client({});

// Helper function for delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function enrichLocationsWithGmap() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully.");

    const BATCH_SIZE = 50; // Locations per batch
    const API_DELAY_MS = 50; // Delay between API calls (Google allows 50 QPS standard)

    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let batchNumber = 0;

    console.log(
      `Starting Google Maps enrichment for '${TARGET_COLLECTION_NAME}'...`
    );

    while (true) {
      batchNumber++;
      console.log(`\n--- Starting Batch ${batchNumber} ---`);

      const remainingCount = await LocationV2.countDocuments({
        gmap_processed: { $ne: true },
      });
      console.log(`Approx. ${remainingCount} locations remaining to process.`);

      if (remainingCount === 0) {
        console.log("All locations have been processed with Google Maps data.");
        break;
      }

      console.log(`Fetching up to ${BATCH_SIZE} unprocessed locations...`);
      const locationsToEnrich = await LocationV2.find({
        gmap_processed: { $ne: true },
      })
        .limit(BATCH_SIZE)
        .select("_id lat lng") // Select necessary fields
        .lean();

      if (locationsToEnrich.length === 0) {
        console.log(
          "No more locations found in this query attempt. Exiting loop."
        );
        break;
      }
      console.log(
        `Fetched ${locationsToEnrich.length} locations for this batch.`
      );

      let bulkOps = [];

      for (const loc of locationsToEnrich) {
        totalProcessed++;
        try {
          // console.log(`Processing location ID: ${loc._id} (${loc.lat}, ${loc.lng})`);
          const response = await gmapsClient.reverseGeocode({
            params: {
              latlng: { latitude: loc.lat, longitude: loc.lng },
              key: GOOGLE_MAPS_API_KEY,
              result_type:
                "street_address|route|intersection|political|administrative_area_level_1|administrative_area_level_2|administrative_area_level_3|locality|sublocality|neighborhood|premise|subpremise|point_of_interest|natural_feature|airport|park|postal_code", // Broad types
              language: "en", // Optional: specify language
            },
            timeout: 5000, // milliseconds
          });

          if (
            response.data.status === "OK" &&
            response.data.results.length > 0
          ) {
            // Extract top 3 formatted addresses
            const topAddresses = response.data.results
              .slice(0, 3)
              .map((result) => result.formatted_address)
              .filter((addr) => addr); // Ensure addresses are not null/empty

            if (topAddresses.length > 0) {
              console.log(
                `  -> Found ${topAddresses.length} addresses for ${loc._id}.`
              );
              bulkOps.push({
                updateOne: {
                  filter: { _id: loc._id },
                  update: {
                    $set: {
                      addresses: topAddresses,
                      gmap_processed: true,
                    },
                  },
                },
              });
              totalUpdated++;
            } else {
              console.warn(
                `  -> Geocoding OK but no addresses found for ${loc._id}. Marking processed.`
              );
              bulkOps.push({
                // Mark as processed even if no addresses found
                updateOne: {
                  filter: { _id: loc._id },
                  update: { $set: { gmap_processed: true } },
                },
              });
            }
          } else {
            console.warn(
              `  -> Geocoding failed or no results for ${loc._id}: ${
                response.data.status
              } - ${response.data.error_message || "No results"}`
            );
            bulkOps.push({
              // Mark as processed to avoid retrying failed lookups indefinitely
              updateOne: {
                filter: { _id: loc._id },
                update: { $set: { gmap_processed: true } },
              },
            });
          }

          // Optional delay to respect API rate limits
          if (API_DELAY_MS > 0) {
            await delay(API_DELAY_MS);
          }
        } catch (error) {
          console.error(
            `  -> Error processing location ${loc._id}:`,
            error.message
          );
          totalErrors++;
          // Decide if you want to mark as processed on error or retry later
          bulkOps.push({
            // Marking as processed on error to avoid blocking
            updateOne: {
              filter: { _id: loc._id },
              update: {
                $set: { gmap_processed: true, gmap_error: error.message },
              }, // Optionally store error
            },
          });
        }
      } // End loop through batch locations

      // Execute batch update
      if (bulkOps.length > 0) {
        console.log(
          `Executing batch update for ${bulkOps.length} locations...`
        );
        try {
          const result = await LocationV2.bulkWrite(bulkOps);
          console.log(
            ` -> Batch executed. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`
          );
        } catch (bulkError) {
          console.error("Error during bulkWrite:", bulkError);
          totalErrors += bulkOps.length; // Assume all in batch failed if bulkWrite errors
        }
      } else {
        console.log("No operations to execute for this batch.");
      }
    } // End while loop

    console.log("\n--- Google Maps Enrichment Summary ---");
    console.log(`Total locations fetched for processing: ${totalProcessed}`);
    console.log(
      `Locations successfully updated with addresses: ${totalUpdated}`
    );
    console.log(
      `Locations processed with errors or no results: ${
        totalProcessed - totalUpdated
      }`
    ); // Includes errors + explicit no results
    console.log(`Direct errors during processing: ${totalErrors}`);
  } catch (error) {
    console.error(
      "An error occurred during the Google Maps enrichment process:",
      error
    );
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }
  }
}

enrichLocationsWithGmap();
