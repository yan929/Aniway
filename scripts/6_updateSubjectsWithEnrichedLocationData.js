require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const path = require('path');

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI;
const BATCH_SIZE = 100; // Process subjects in batches

// --- Mongoose Schemas and Models ---

// Define a minimal schema for StandardizedLocation to fetch necessary data
const standardizedLocationSchema = new mongoose.Schema({
    _id: String, // This is the rounded lat/lng key
    gmap_formatted_addresses: [String]
}, { collection: 'standardized_locations', read: 'secondaryPreferred' }); // Read from secondary if possible
const StandardizedLocation = mongoose.model('StandardizedLocationLookup', standardizedLocationSchema);

// Define the structure within the locations_info array
const locationInfoSchema = new mongoose.Schema({
    original_location_id: String,
    name: String,
    name_cn: String,
    lat_precise: Number,
    lng_precise: Number,
    standardized_location_id: String, // Links to StandardizedLocation _id
    lat_rounded: Number,
    lng_rounded: Number,
    gmap_formatted_addresses: [String] // Field to be added/updated
}, { _id: false });

// Define a minimal schema for Subject to update locations_info
const subjectSchema = new mongoose.Schema({
    locations_info: [locationInfoSchema]
}, { collection: 'subjects', strict: false }); // Allow other fields
const Subject = mongoose.model('SubjectUpdate', subjectSchema);

// --- Main Function ---
async function updateSubjectsWithEnrichedData() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    let subjectsProcessed = 0;
    let page = 1;
    let hasMoreSubjects = true;

    try {
        while (hasMoreSubjects) {
            console.log(`--- Processing Subject Batch ${page} ---`);
            const subjects = await Subject.find()
                .select('locations_info') // Select only necessary fields
                .skip((page - 1) * BATCH_SIZE)
                .limit(BATCH_SIZE)
                .lean(); // Use lean for performance

            if (subjects.length === 0) {
                hasMoreSubjects = false;
                console.log('No more subjects found.');
                break;
            }

            console.log(`Fetched ${subjects.length} subjects for batch ${page}.`);

            // 1. Collect unique standardized_location_ids from this batch
            const standardizedIds = new Set();
            subjects.forEach(subject => {
                if (subject.locations_info) {
                    subject.locations_info.forEach(locInfo => {
                        if (locInfo.standardized_location_id) {
                            standardizedIds.add(locInfo.standardized_location_id);
                        }
                    });
                }
            });

            if (standardizedIds.size === 0) {
                console.log('No standardized location IDs found in this batch. Skipping enrichment for this batch.');
                subjectsProcessed += subjects.length;
                page++;
                continue;
            }

            // 2. Fetch corresponding standardized locations
            const standardizedLocations = await StandardizedLocation.find({
                _id: { $in: Array.from(standardizedIds) }
            }).select('_id gmap_formatted_addresses').lean();

            // 3. Create a lookup map
            const addressMap = new Map();
            standardizedLocations.forEach(stdLoc => {
                addressMap.set(stdLoc._id, stdLoc.gmap_formatted_addresses || []); // Use empty array if missing
            });
            console.log(`Fetched ${addressMap.size} standardized locations for lookup.`);

            // 4. Prepare bulk updates
            const bulkOps = [];
            subjects.forEach(subject => {
                let updated = false;
                if (subject.locations_info) {
                    subject.locations_info.forEach(locInfo => {
                        if (locInfo.standardized_location_id) {
                            const addresses = addressMap.get(locInfo.standardized_location_id);
                            // Update only if addresses are found and different or not yet set
                            // (Avoid unnecessary writes if data hasn't changed)
                            if (addresses && JSON.stringify(locInfo.gmap_formatted_addresses) !== JSON.stringify(addresses)) {
                                locInfo.gmap_formatted_addresses = addresses;
                                updated = true;
                            }
                        }
                    });
                }

                // If any location_info within the subject was updated, add to bulk ops
                if (updated) {
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: subject._id },
                            update: { $set: { locations_info: subject.locations_info } }
                        }
                    });
                }
            });

            // 5. Execute bulk write if there are operations
            if (bulkOps.length > 0) {
                console.log(`Executing ${bulkOps.length} updates for batch ${page}...`);
                const result = await Subject.bulkWrite(bulkOps, { ordered: false }); // Don't stop on error
                console.log(`Batch ${page} update result: Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
                if (result.hasWriteErrors()) {
                    console.warn(`Batch ${page} encountered write errors:`, result.getWriteErrors());
                }
            } else {
                console.log(`No updates needed for batch ${page}.`);
            }

            subjectsProcessed += subjects.length;
            console.log(`Processed ${subjectsProcessed} subjects so far.`);
            page++;

             // Small delay between batches to avoid overwhelming the DB
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log(`\nSuccessfully processed ${subjectsProcessed} subjects.`);

    } catch (error) {
        console.error('\nAn error occurred during the update process:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

// Run the function
updateSubjectsWithEnrichedData();
