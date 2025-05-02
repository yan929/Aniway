// scripts/18_copyCollectionsToAniway.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI_BASE = process.env.MONGODB_URI;
const SOURCE_DB_NAME = "bangumi";
const TARGET_DB_NAME = "aniway";

const COLLECTIONS_TO_COPY = [
  { source: "anime1", target: "anime" },
  { source: "locations_v2", target: "locations" },
];

if (!MONGODB_URI_BASE) {
  console.error("Error: MONGODB_URI is not defined in .env file.");
  process.exit(1);
}

// Function to construct DB specific URI
function constructDbUri(baseUri, dbName) {
  const uri = new URL(baseUri);
  uri.pathname = `/${dbName}`; // Set the database name in the path
  return uri.toString();
}

const MONGODB_URI_SOURCE = constructDbUri(MONGODB_URI_BASE, SOURCE_DB_NAME);

async function copyCollections() {
  let sourceConn;
  try {
    console.log(`Connecting to source database: ${SOURCE_DB_NAME}...`);
    sourceConn = await mongoose
      .createConnection(MONGODB_URI_SOURCE)
      .asPromise();
    console.log(`Connected to source DB: ${sourceConn.name}`);

    for (const collectionInfo of COLLECTIONS_TO_COPY) {
      const sourceCollectionName = collectionInfo.source;
      const targetCollectionName = collectionInfo.target;
      console.log(
        `\nAttempting to copy '${SOURCE_DB_NAME}.${sourceCollectionName}' to '${TARGET_DB_NAME}.${targetCollectionName}'...`
      );

      // Get a reference to the source collection using the native driver collection object
      const sourceCollection = sourceConn.collection(sourceCollectionName);

      // Define the aggregation pipeline using $match and $out
      const pipeline = [
        { $match: {} }, // Match all documents in the source collection
        {
          $out: { db: TARGET_DB_NAME, coll: targetCollectionName }, // Output to the target DB and collection
        },
      ];

      try {
        // Execute the aggregation pipeline
        // Note: $out returns nothing on success, so we just wait for it to complete.
        // It will throw an error if something goes wrong.
        console.log(` -> Executing $out aggregation...`);
        await sourceCollection.aggregate(pipeline).toArray(); // .toArray() or .next() is needed to execute
        console.log(
          ` -> Successfully copied '${sourceCollectionName}' to '${TARGET_DB_NAME}.${targetCollectionName}'.`
        );
      } catch (aggError) {
        console.error(
          ` -> Error during aggregation for ${sourceCollectionName}:`,
          aggError
        );
        // Decide if you want to stop or continue with the next collection
        // For now, let's stop on error
        throw aggError;
      }
    }

    console.log("\nCollection copy process completed successfully.");
  } catch (error) {
    console.error(
      "\nAn error occurred during the collection copy process:",
      error
    );
  } finally {
    // Ensure the source database connection is closed
    if (sourceConn && sourceConn.readyState === 1) {
      await sourceConn.close();
      console.log(`Source DB connection (${sourceConn.name}) closed.`);
    }
  }
}

copyCollections();
