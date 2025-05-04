import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';

dotenv.config(); // Initialize dotenv right after imports

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI;
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_API_HOST = 'https://maps.googleapis.com/maps/api';
const BATCH_SIZE = 50; // How many locations to process in one go
const DELAY_MS = 200; // Delay between batches to respect API limits
const RADIUS_METERS = 50; // Search radius for Nearby Search

// --- Mongoose Setup ---
// Define a minimal schema for locations to fetch necessary fields and add new ones
const locationSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  gmap_nearby_enriched: { type: Boolean, default: false },
  gmap_nearby_response: mongoose.Schema.Types.Mixed, // To store the raw API response
}, { strict: false }); // Allow other fields not defined in schema

const Location = mongoose.model('Location', locationSchema, 'locations');

// --- Helper Functions ---
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function enrichLocationBatch(locations) {
  const bulkOps = [];
  let successCount = 0;
  let errorCount = 0;

  for (const loc of locations) {
    const nearbyUrl = `${GOOGLE_API_HOST}/place/nearbysearch/json?location=${loc.lat},${loc.lng}&radius=${RADIUS_METERS}&key=${GOOGLE_API_KEY}`;
    let nearbyResponse = null;
    let status = 'FAILED'; // Default status

    try {
      await delay(DELAY_MS); // Add delay before each API call
      const res = await axios.get(nearbyUrl);
      nearbyResponse = res.data;
      status = res.data.status; // Capture Google's status (OK, ZERO_RESULTS, etc.)
      console.log(`  -> Fetched for location ID ${loc._id}. Status: ${status}`);
      successCount++;
    } catch (error) {
      console.error(`  -> Error fetching Nearby Search for location ID ${loc._id}:`, error.message);
      if (error.response) {
        console.error(`    Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
        nearbyResponse = error.response.data; // Store error response if available
        status = error.response.data.status || 'HTTP_ERROR';
      } else {
         status = 'NETWORK_ERROR';
      }
      errorCount++;
    }

    // Prepare bulk update operation
    bulkOps.push({
      updateOne: {
        filter: { _id: loc._id },
        update: {
          $set: {
            gmap_nearby_response: nearbyResponse, // Store the full response (success or error)
            gmap_nearby_enriched: true // Mark as processed regardless of success/failure
          }
        }
      }
    });
  }

  // Execute bulk write if there are operations
  if (bulkOps.length > 0) {
    try {
      const result = await Location.bulkWrite(bulkOps, { ordered: false });
      console.log(`  -> Bulk write executed. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
    } catch (bulkWriteError) {
      console.error('  -> Error during bulk write:', bulkWriteError);
      // Handle bulk write error (e.g., log it), but continue processing
    }
  }
  return { successCount, errorCount };
}

// --- Main Execution ---
async function main() {
  if (!MONGODB_URI || !GOOGLE_API_KEY) {
    console.error('Error: MONGODB_URI and GOOGLE_MAPS_API_KEY must be set in .env file.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalErrors = 0;
  let hasMore = true;

  console.log(`Starting Nearby Search enrichment process with batch size ${BATCH_SIZE} and radius ${RADIUS_METERS}m...`);

  while (hasMore) {
    console.log(`Fetching next batch of ${BATCH_SIZE} locations to enrich...`);
    const locationsToProcess = await Location.find({
      gmap_nearby_enriched: { $ne: true },
      lat: { $exists: true, $ne: null }, // Ensure lat/lng exist
      lng: { $exists: true, $ne: null }
    })
    .limit(BATCH_SIZE)
    .lean(); // Use lean for performance as we only need data

    if (locationsToProcess.length === 0) {
      console.log('No more locations found to enrich.');
      hasMore = false;
      break;
    }

    console.log(`Processing batch of ${locationsToProcess.length} locations...`);
    const batchResult = await enrichLocationBatch(locationsToProcess);
    totalProcessed += locationsToProcess.length;
    totalSuccess += batchResult.successCount;
    totalErrors += batchResult.errorCount;

    console.log(`Batch finished. Processed in batch: ${locationsToProcess.length}. Total processed so far: ${totalProcessed}`);
    console.log(`API Calls - Success: ${batchResult.successCount}, Errors: ${batchResult.errorCount}`);

    // Optional: Add a longer delay between batches if needed
    // await delay(1000); 
  }

  console.log('\n--- Enrichment Summary ---');
  console.log(`Total locations processed: ${totalProcessed}`);
  console.log(`Total successful API calls: ${totalSuccess}`);
  console.log(`Total API call errors: ${totalErrors}`);
  console.log('--------------------------\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

main().catch(err => {
  console.error('Unhandled error during script execution:', err);
  mongoose.disconnect();
  process.exit(1);
});
