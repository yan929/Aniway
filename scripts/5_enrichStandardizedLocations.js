require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const axios = require('axios');

// --- Configuration ---
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

// --- Schema Definition ---
// Adjusted schema for this script's purpose
const standardizedLocationSchema = new mongoose.Schema({
    _id: String, // Representative original location ID
    name: String,
    name_cn: String,
    lat_precise: Number,
    lng_precise: Number,
    gmap_formatted_addresses: [String], // Store array of results
    gmap_processed: { type: Boolean, default: false }, // Flag to track processing attempt
    gmap_raw_response: mongoose.Schema.Types.Mixed, // Store the raw API response
    // Other fields are not strictly needed for this script's update logic
}, { collection: 'standardized_locations', timestamps: true });
const StandardizedLocation = mongoose.model('StandardizedLocationEnrich', standardizedLocationSchema);

const BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

async function enrichLocations() {
    if (!GOOGLE_MAPS_API_KEY) {
        console.error('Error: GOOGLE_MAPS_API_KEY is not defined in .env file.');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        const BATCH_SIZE = 50; // Number of locations to process per batch
        const API_DELAY_MS = 50; // Delay between API calls in ms (set to 0 to disable)
        let totalProcessed = 0;
        let batchNumber = 0;

        while (true) { // Loop until no more locations need processing
            batchNumber++;
            console.log(`\n--- Starting Batch ${batchNumber} ---`);
            const remainingCount = await StandardizedLocation.countDocuments({ gmap_processed: { $ne: true } });
            console.log(`Approx. ${remainingCount} locations remaining to process.`);

            if (remainingCount === 0) {
                console.log("All locations have been processed.");
                break; // Exit the loop
            }

            console.log(`Fetching up to ${BATCH_SIZE} unprocessed locations...`);
            const locationsToEnrich = await StandardizedLocation.find({ gmap_processed: { $ne: true } })
                .limit(BATCH_SIZE)
                .select('_id lat_precise lng_precise') // Select necessary fields
                .lean(); // Use lean for performance

            if (locationsToEnrich.length === 0) {
                console.log("No more locations found in this query attempt. Exiting.");
                break; // Exit loop if query unexpectedly returns empty
            }

            console.log(`Processing ${locationsToEnrich.length} locations in batch ${batchNumber}...`);
            const bulkOps = [];
            let batchProcessedCount = 0;

            for (const loc of locationsToEnrich) {
                // Ensure coordinates are valid
                if (loc._id == null || typeof loc.lat_precise !== 'number' || typeof loc.lng_precise !== 'number') {
                    console.warn(`   ID ${loc._id}: Skipping location with invalid data: ${JSON.stringify(loc)}. Marking as processed.`);
                    bulkOps.push({ // Mark as processed to avoid retrying
                        updateOne: {
                            filter: { _id: loc._id },
                            update: { $set: {
                                gmap_processed: true,
                                gmap_formatted_addresses: ['ERROR: Invalid Coords'],
                                gmap_raw_response: { error: 'Invalid Coordinates', data: loc } // Store invalid data
                            } }
                        }
                    });
                    batchProcessedCount++; // Count it as processed for logging
                    totalProcessed++;
                    continue;
                }

                const lat = loc.lat_precise;
                const lng = loc.lng_precise;

                try {
                    const response = await axios.get(BASE_URL, {
                        params: {
                            latlng: `${lat},${lng}`,
                            key: GOOGLE_MAPS_API_KEY,
                            language: 'en', // Request English names
                        }
                    });

                    let top3Addresses = [];
                    if (response.data.status === 'OK' && response.data.results.length > 0) {
                        // Extract all formatted addresses
                        const formattedAddresses = response.data.results.map(result => result.formatted_address);
                        // Keep only the top 3
                        top3Addresses = formattedAddresses.slice(0, 3);
                        // console.log(`   ID ${loc._id}: Found ${formattedAddresses.length}, storing top 3.`); // Optional verbose log
                    } else {
                        console.warn(`   ID ${loc._id}: No results or error from API: ${response.data.status}`);
                        // top3Addresses remains []
                    }

                    // Add update operation to bulk list - mark as processed
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: loc._id },
                            update: {
                                $set: {
                                    gmap_formatted_addresses: top3Addresses,
                                    gmap_processed: true, // Mark as processed
                                    gmap_raw_response: response.data // Save the raw response
                                }
                            }
                        }
                    });
                } catch (error) {
                    console.error(`   ID ${loc._id}: Error during API call: ${error.message}. Marking as processed.`);
                    // Mark as processed even on error to avoid infinite loops
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: loc._id },
                            update: { $set: {
                                gmap_formatted_addresses: ['ERROR: API Call Failed'],
                                gmap_processed: true,
                                gmap_raw_response: { error: 'API Call Failed', message: error.message } // Save error info
                            } }
                        }
                    });
                }

                batchProcessedCount++;
                totalProcessed++;
                // Log progress within the batch
                if (batchProcessedCount % 10 === 0 || batchProcessedCount === locationsToEnrich.length) {
                    console.log(`   Batch ${batchNumber}: Processed ${batchProcessedCount}/${locationsToEnrich.length}... (Total processed overall: ${totalProcessed})`);
                }

                // Optional: Add a small delay to avoid hitting API rate limits too quickly
                if (API_DELAY_MS > 0) {
                    await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));
                }
            } // End of batch location loop

            // Execute all bulk operations for the current batch
            if (bulkOps.length > 0) {
                console.log(`Executing ${bulkOps.length} updates for batch ${batchNumber}...`);
                const bulkResult = await StandardizedLocation.bulkWrite(bulkOps);
                console.log(`Batch ${batchNumber} update result: Matched: ${bulkResult.matchedCount}, Modified: ${bulkResult.modifiedCount}`);
            } else {
                console.log(`Batch ${batchNumber}: No updates to execute (all skipped?).`);
            }
            console.log(`--- Finished Batch ${batchNumber} ---`);
        } // End of while loop
    } catch (error) {
        console.error('An unrecoverable error occurred during the enrichment process:', error);
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState === 1) { // Check if connected before disconnecting
            console.log('Disconnecting from MongoDB...');
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB.');
        }
    }
}

enrichLocations();
