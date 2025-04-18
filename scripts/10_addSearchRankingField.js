require("dotenv").config({
  path: require("path").resolve(__dirname, "../backend/.env"),
}); // Use backend .env for aniway DB URI
const mongoose = require("mongoose");
const path = require("path");

// --- Configuration ---
const TARGET_MONGODB_URI = process.env.MONGO_URI; // From backend/.env (target DB = 'aniway')
const COLLECTIONS_TO_UPDATE = ["anime", "locations"];
const FIELD_TO_ADD = "search_ranking";
const DEFAULT_VALUE = 0;

// --- Main Update Function ---
async function addSearchRankingField() {
  if (!TARGET_MONGODB_URI) {
    console.error("Error: MONGO_URI is not defined in the backend/.env file.");
    process.exit(1);
  }

  console.log(`Connecting to target database: ${TARGET_MONGODB_URI}`);
  let connection;
  try {
    connection = await mongoose
      .createConnection(TARGET_MONGODB_URI)
      .asPromise();
    console.log("Connected to target database (aniway).");

    const db = connection.db;

    for (const collectionName of COLLECTIONS_TO_UPDATE) {
      console.log(`\nProcessing collection: ${collectionName}...`);
      const collection = db.collection(collectionName);

      // Define the filter to find documents missing the field
      const filter = { [FIELD_TO_ADD]: { $exists: false } };

      // Define the update operation to set the default value
      const updateDoc = {
        $set: { [FIELD_TO_ADD]: DEFAULT_VALUE },
      };

      console.log(
        `Adding field '${FIELD_TO_ADD}: ${DEFAULT_VALUE}' to documents in '${collectionName}' where it doesn't exist...`
      );

      const result = await collection.updateMany(filter, updateDoc);

      console.log(`Update result for '${collectionName}':`);
      console.log(
        `  Documents matched (missing the field): ${result.matchedCount}`
      );
      console.log(`  Documents modified: ${result.modifiedCount}`);
      if (result.upsertedCount > 0) {
        console.log(`  Documents upserted: ${result.upsertedCount}`); // Should be 0
      }
      if (!result.acknowledged) {
        console.warn(
          `  Warning: Update operation for '${collectionName}' was not acknowledged.`
        );
      }
    }

    console.log(
      `\nField addition process completed for database '${db.databaseName}'.`
    );
  } catch (error) {
    console.error(
      "\nAn error occurred during the field addition process:",
      error
    );
  } finally {
    if (connection) {
      await connection.close();
      console.log("Disconnected from target database.");
    }
  }
}

// Run the update function
addSearchRankingField();
