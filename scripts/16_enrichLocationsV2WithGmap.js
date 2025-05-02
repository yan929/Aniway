// scripts/16_enrichLocationsV2WithGmap.js
// MODIFIED: Now enriches the final 'locations' collection with Gmap raw response, addresses, country, and city, using a combined 'geoEnriched' flag. Integrate country/city extraction logic.
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Client } from "@googlemaps/google-maps-services-js";

dotenv.config(); // Load environment variables from .env file

const MONGODB_URI = process.env.MONGODB_URI;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
// MODIFIED: Target the final 'locations' collection
const TARGET_COLLECTION_NAME = "locations";

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not defined in .env file.");
  process.exit(1);
}
if (!GOOGLE_MAPS_API_KEY) {
  console.error("Error: GOOGLE_MAPS_API_KEY is not defined in .env file.");
  process.exit(1);
}

// MODIFIED: Schema updated to match backend/models/Location.js
const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    addresses: [String], // Existing: Will store formatted addresses
    originIds: [String], // Keep existing fields from previous migrations/extractions
    anitabi_names: [String],
    anitabi_cn_names: [String],
    images: [String],
    searchRanking: { type: Number, default: 0 }, // Keep existing
    // Fields added by this enrichment script
    country: { type: String, index: true },
    city: { type: String, index: true },
    gmap_raw_response: { type: Object }, // NEW: Store raw gmap response
    geoEnriched: { type: Boolean, default: false, index: true }, // NEW: Combined flag
    gmap_error: { type: String }, // Existing: Keep for error logging
  },
  {
    collection: TARGET_COLLECTION_NAME,
    timestamps: true,
  }
);

// Use existing index
locationSchema.index({ lat: 1, lng: 1 }); // Assuming this should identify unique locations based on coords
// Add index for the new flag
locationSchema.index({ geoEnriched: 1 });

// MODIFIED: Model name and schema
const Location = mongoose.model("LocationEnrich", locationSchema);

const gmapsClient = new Client({});

// Helper function for delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- ADDED: Function to extract country and city (from script 20) ---
function extractGeoInfo(gmapRawResponse) {
  let country = null;
  let city = null;

  if (
    !gmapRawResponse ||
    !Array.isArray(gmapRawResponse.results) ||
    gmapRawResponse.results.length === 0
  ) {
    // console.warn("No valid results in gmapRawResponse for geo extraction");
    return { country, city };
  }

  const result = gmapRawResponse.results[0]; // Use first result
  if (!result || !Array.isArray(result.address_components)) {
    // console.warn("No address components in the first result for geo extraction");
    return { country, city };
  }

  const addressComponents = result.address_components;
  for (const component of addressComponents) {
    if (
      component.types.includes("country") &&
      component.types.includes("political")
    ) {
      country = component.long_name;
    }
    if (
      component.types.includes("locality") &&
      component.types.includes("political")
    ) {
      city = component.long_name;
    } else if (
      !city &&
      component.types.includes("administrative_area_level_1") &&
      component.types.includes("political")
    ) {
      city = component.long_name; // Fallback to state/prefecture
    }
    if (country && city) break;
  }
  return { country, city };
}
// --- END ADDED FUNCTION ---

async function enrichLocationsWithGmap() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully.");

    const BATCH_SIZE = 50; // Locations per batch
    const API_DELAY_MS = 50; // Delay between API calls

    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let batchNumber = 0;

    console.log(
      // MODIFIED: Log message
      `Starting Google Maps enrichment (addresses, country, city, raw response) for '${TARGET_COLLECTION_NAME}'...`
    );

    while (true) {
      batchNumber++;
      console.log(`\n--- Starting Batch ${batchNumber} ---`);

      // MODIFIED: Query using the new flag
      const remainingCount = await Location.countDocuments({
        geoEnriched: { $ne: true },
      });
      console.log(`Approx. ${remainingCount} locations remaining to process.`);

      if (remainingCount === 0) {
        // MODIFIED: Log message
        console.log(
          "All locations have been processed/attempted for geo-enrichment."
        );
        break;
      }

      console.log(`Fetching up to ${BATCH_SIZE} unprocessed locations...`);
      // MODIFIED: Query using the new flag and model
      const locationsToEnrich = await Location.find({
        geoEnriched: { $ne: true },
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
        // MODIFIED: Initialize update object - always mark as processed
        let updateOp = {
          $set: {
            geoEnriched: true,
            // Ensure fields are at least nulled if not found, avoid leftover data
            addresses: [],
            country: null,
            city: null,
            gmap_raw_response: null,
            gmap_error: null,
          },
        };

        try {
          const response = await gmapsClient.reverseGeocode({
            params: {
              latlng: { latitude: loc.lat, longitude: loc.lng },
              key: GOOGLE_MAPS_API_KEY,
              result_type:
                "street_address|route|intersection|political|administrative_area_level_1|administrative_area_level_2|administrative_area_level_3|locality|sublocality|neighborhood|premise|subpremise|point_of_interest|natural_feature|airport|park|postal_code",
              language: "en",
            },
            timeout: 5000, // milliseconds
          });

          if (
            response.data.status === "OK" &&
            response.data.results.length > 0
          ) {
            const rawResponse = response.data; // Keep the raw data
            // Extract addresses
            const topAddresses = rawResponse.results
              .slice(0, 3)
              .map((result) => result.formatted_address)
              .filter((addr) => addr);

            // Extract country and city using the helper function
            const { country, city } = extractGeoInfo(rawResponse);

            // Update the $set operation
            updateOp.$set.gmap_raw_response = rawResponse;
            updateOp.$set.addresses = topAddresses;
            if (country) updateOp.$set.country = country;
            if (city) updateOp.$set.city = city;

            if (topAddresses.length > 0 || country || city) {
              console.log(
                `  -> Success for ${loc._id}. Addr: ${
                  topAddresses.length
                }, Country: ${country || "N/A"}, City: ${city || "N/A"}`
              );
              totalUpdated++;
            } else {
              console.warn(
                `  -> Geocoding OK but no addresses/geo info found for ${loc._id}. Marking processed.`
              );
            }
          } else {
            // Handle failed geocoding or no results
            console.warn(
              `  -> Geocoding failed or no results for ${loc._id}: ${
                response.data.status
              } - ${response.data.error_message || "No results"}`
            );
            updateOp.$set.gmap_error = `${response.data.status}: ${
              response.data.error_message || "No results"
            }`;
          }
        } catch (error) {
          console.error(
            `  -> Error processing location ${loc._id}:`,
            error.message
          );
          totalErrors++;
          // Store error message
          updateOp.$set.gmap_error = error.message;
        }

        // Add the prepared update operation to bulkOps
        bulkOps.push({
          updateOne: {
            filter: { _id: loc._id },
            update: updateOp,
          },
        });

        // Optional delay
        if (API_DELAY_MS > 0) {
          await delay(API_DELAY_MS);
        }
      } // End loop through batch locations

      // Execute batch update
      if (bulkOps.length > 0) {
        console.log(
          `Executing batch update for ${bulkOps.length} locations...`
        );
        try {
          // MODIFIED: Use updated Model
          const result = await Location.bulkWrite(bulkOps, { ordered: false });
          console.log(
            ` -> Batch executed. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`
          );
        } catch (bulkError) {
          console.error("Error during bulkWrite:", bulkError);
          totalErrors += bulkOps.length; // Assume all in batch failed
        }
      } else {
        console.log("No operations to execute for this batch.");
      }
    } // End while loop

    console.log("\n--- Google Maps Enrichment Summary ---");
    console.log(`Total locations fetched for processing: ${totalProcessed}`);
    console.log(
      // MODIFIED: Log message
      `Locations successfully updated with geo data: ${totalUpdated}`
    );
    console.log(
      // MODIFIED: Log message
      `Locations processed but yielded no data: ${
        totalProcessed - totalUpdated - totalErrors
      }`
    );
    console.log(`Direct errors during processing: ${totalErrors}`);
  } catch (error) {
    console.error(
      // MODIFIED: Log message
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
