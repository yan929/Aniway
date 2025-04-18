require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');

// Define Subject Schema
const subjectSchema = new mongoose.Schema({
    id: Number, // Original subject ID from source
    locations: [
        {
            id: String, // Original location ID from source
            name: String, // Original name
            geo: [Number], // [lat, lng]
            // Include other fields if needed, but keep it minimal for this script
            _id: false, // Don't need the default subdocument ID
        },
    ],
    locations_info: [ // New top-level array for standardized references
        {
            original_location_id: String,
            standardized_location_id: String, // ID from standardized_locations
            lat_rounded: Number,
            lng_rounded: Number,
            lat_precise: Number, // Add precise coordinates
            lng_precise: Number, // Add precise coordinates
            _id: false
        }
    ],
    // Add other subject fields if you need to read/write them, otherwise keep minimal
}, { collection: 'subjects', timestamps: true }); // Use timestamps if they exist or you want them
const Subject = mongoose.model('SubjectForUpdate', subjectSchema); // Use a distinct model name

// Define StandardizedLocation Schema (to read from)
const standardizedLocationSchema = new mongoose.Schema({
    _id: String, // Representative original location ID
    name: String,
    name_cn: String, // Chinese name
    lat_precise: Number,
    lng_precise: Number,
    lat_rounded: Number,
    lng_rounded: Number,
    original_location_ids: [String],
}, { collection: 'standardized_locations' });
const StandardizedLocation = mongoose.model('StandardizedLocationForRead', standardizedLocationSchema); // Distinct name

/**
 * Rounds a number to a specified number of decimal places.
 * @param {number} num - The number to round.
 * @param {number} decimals - The number of decimal places.
 * @returns {number} - The rounded number.
 */
function roundTo(num, decimals) {
    if (typeof num !== 'number' || isNaN(num)) return NaN; // Handle non-numeric input
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
}

async function main() {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        console.error('Error: MONGODB_URI environment variable not set.');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        console.log('Fetching standardized locations map...');
        const standardizedDocs = await StandardizedLocation.find({}).lean();
        const standardizedMap = new Map();
        for (const doc of standardizedDocs) {
            // Ensure necessary fields exist before creating the map entry
            if (doc.lat_rounded != null && doc.lng_rounded != null && doc._id != null && doc.name != null && doc.lat_precise != null && doc.lng_precise != null) {
                 const key = `${doc.lat_rounded}_${doc.lng_rounded}`;
                 // Store the object structure expected in the subject's locations array
                 standardizedMap.set(key, {
                     _id: doc._id, // The representative ID
                     name: doc.name,
                     name_cn: doc.name_cn, // Add Chinese name (will be null if missing)
                     lat_rounded: doc.lat_rounded,
                     lng_rounded: doc.lng_rounded,
                     lat_precise: doc.lat_precise,
                     lng_precise: doc.lng_precise,
                     // Add other fields from the representative if needed
                 });
            } else {
                console.warn(`Skipping standardized location doc with missing critical fields: ${JSON.stringify(doc)}`)
            }
        }
        console.log(`Loaded ${standardizedMap.size} standardized locations into map.`);

        if (standardizedMap.size === 0) {
            console.error("Standardized locations map is empty. Cannot proceed. Run standardizeLocations.js first.");
            return;
        }

        console.log('Fetching subjects...');
        // Fetch only necessary fields to reduce memory usage
        const subjects = await Subject.find({}, { locations: 1 }).lean();
        console.log(`Fetched ${subjects.length} subjects.`);

        const bulkOps = []; // Operations to update subjects

        console.log('Processing subjects and preparing updates...');
        for (const subject of subjects) {
            if (!subject.locations || subject.locations.length === 0) {
                continue; // Skip subjects with no locations
            }

            const originalLocations = subject.locations;
            const newLocationsInfoArray = []; // Array to hold the new references

            for (const originalLoc of originalLocations) {
                if (!originalLoc || !originalLoc.id || !originalLoc.geo || originalLoc.geo.length !== 2) {
                    console.warn(`Subject ${subject._id}: Skipping invalid location object: ${JSON.stringify(originalLoc)}`);
                    continue;
                }

                const [lat, lng] = originalLoc.geo;
                const roundedLat = roundTo(lat, 2);
                const roundedLng = roundTo(lng, 2);

                // Handle cases where rounding might fail (e.g., non-numeric geo)
                if (isNaN(roundedLat) || isNaN(roundedLng)) {
                    console.warn(`Subject ${subject._id}: Skipping location due to non-numeric geo: ${JSON.stringify(originalLoc)}`);
                    continue;
                }

                const key = `${roundedLat}_${roundedLng}`;
                const representativeLoc = standardizedMap.get(key);

                if (representativeLoc) {
                    // Create the reference object and add it to the array
                    newLocationsInfoArray.push({
                        original_location_id: originalLoc.id,
                        standardized_location_id: representativeLoc._id,
                        lat_rounded: representativeLoc.lat_rounded,
                        lng_rounded: representativeLoc.lng_rounded,
                        lat_precise: representativeLoc.lat_precise, // Add precise lat
                        lng_precise: representativeLoc.lng_precise  // Add precise lng
                    });
                    // Log added for clarity, can be removed for performance
                    // console.log(`    -> Subject ${subject._id}: Adding ref for ${originalLoc.id} -> ${representativeLoc._id}`);
                } else {
                    console.warn(`Subject ${subject._id}: No standardized representative found for key ${key} (original location ID: ${originalLoc.id}).`);
                }
            }

            // After processing all locations for a subject, add the update op if needed
            if (newLocationsInfoArray.length > 0) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: subject._id },
                        update: { $set: { locations_info: newLocationsInfoArray } }
                    }
                });
            }
        }

        console.log(`Prepared ${bulkOps.length} bulk update operations for subjects.`);

        if (bulkOps.length > 0) {
            console.log('Starting bulk update for subject locations_info...');
            const bulkResult = await Subject.bulkWrite(bulkOps);
            console.log('Bulk update completed.');
            console.log('Matched:', bulkResult.matchedCount);
            console.log('Modified:', bulkResult.modifiedCount);
        } else {
            console.log('No subjects needed updating with locations_info.');
        }

        console.log('Subject location update process completed.');

    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB.');
        }
    }
}

main();
