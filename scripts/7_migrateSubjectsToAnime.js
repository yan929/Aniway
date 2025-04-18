require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const path = require('path');

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI;
const SOURCE_COLLECTION = 'subjects';
const TARGET_COLLECTION = 'anime';

// --- Main Migration Function ---
async function migrateSubjectsToAnime() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    const db = mongoose.connection.db;
    const sourceCollection = db.collection(SOURCE_COLLECTION);

    try {
        console.log(`Starting migration from '${SOURCE_COLLECTION}' to '${TARGET_COLLECTION}'...`);
        console.log(`This will overwrite the '${TARGET_COLLECTION}' collection if it already exists.`);

        const pipeline = [
            {
                $project: {
                    _id: 1, // Keep the original _id
                    bangumi_id: '$id', // Rename id to bangumi_id
                    createdAt: 1,
                    updatedAt: 1,
                    date: 1,
                    name: 1,
                    name_cn: 1,
                    name_en: 1, // Include name_en (will be null/missing if not present in source)
                    eps: 1,
                    images: 1,
                    overview: 1, // Include overview (will be null/missing if not present in source)
                    summary: 1,
                    locations: '$locations_info' // Rename locations_info to locations
                    // The original 'locations' field is implicitly dropped as it's not included here
                }
            },
            {
                $out: TARGET_COLLECTION // Output the results to the 'anime' collection
            }
        ];

        console.log('Executing aggregation pipeline...');
        // Execute the aggregation pipeline
        await sourceCollection.aggregate(pipeline).toArray(); // .toArray() or .next() is needed to execute $out

        console.log(`Successfully migrated data to the '${TARGET_COLLECTION}' collection.`);

        // Optional: Verify count
        const sourceCount = await sourceCollection.countDocuments();
        const targetCount = await db.collection(TARGET_COLLECTION).countDocuments();
        console.log(`Source collection '${SOURCE_COLLECTION}' count: ${sourceCount}`);
        console.log(`Target collection '${TARGET_COLLECTION}' count: ${targetCount}`);
        if(sourceCount !== targetCount) {
             console.warn('Warning: Source and target document counts do not match. Check the pipeline logic if this was unexpected.');
        }

    } catch (error) {
        console.error('\nAn error occurred during the migration process:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

// Run the migration function
migrateSubjectsToAnime();
