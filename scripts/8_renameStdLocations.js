require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const path = require('path');

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI;
const OLD_COLLECTION_NAME = 'standardized_locations';
const NEW_COLLECTION_NAME = 'locations';

// --- Main Rename Function ---
async function renameCollection() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    const db = mongoose.connection.db;

    try {
        console.log(`Attempting to rename collection '${OLD_COLLECTION_NAME}' to '${NEW_COLLECTION_NAME}'...`);

        // Check if the old collection exists
        const collections = await db.listCollections({ name: OLD_COLLECTION_NAME }).toArray();
        if (collections.length === 0) {
            console.log(`Source collection '${OLD_COLLECTION_NAME}' does not exist. Skipping rename.`);
            return; // Exit gracefully
        }

        // Check if the new collection name already exists (rename might fail or have issues)
        const targetCollections = await db.listCollections({ name: NEW_COLLECTION_NAME }).toArray();
        if (targetCollections.length > 0) {
            console.warn(`Warning: Target collection '${NEW_COLLECTION_NAME}' already exists. Renaming might fail or cause issues. Consider dropping it first if this rename is intended to replace it.`);
            // Optionally drop the target collection if needed:
            // console.log(`Dropping existing target collection '${NEW_COLLECTION_NAME}'...`);
            // await db.collection(NEW_COLLECTION_NAME).drop();
            // console.log(`Target collection '${NEW_COLLECTION_NAME}' dropped.`);
        }

        // Perform the rename operation
        await db.collection(OLD_COLLECTION_NAME).rename(NEW_COLLECTION_NAME);

        console.log(`Successfully renamed collection '${OLD_COLLECTION_NAME}' to '${NEW_COLLECTION_NAME}'.`);

    } catch (error) {
        console.error(`\nAn error occurred during the rename process:`, error);
        // Provide specific advice for common errors if possible
        if (error.codeName === 'NamespaceExists') {
            console.error(`Hint: The collection '${NEW_COLLECTION_NAME}' already exists. Drop it first if you intend to overwrite it.`);
        }
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

// Run the rename function
renameCollection();
