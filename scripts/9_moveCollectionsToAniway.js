require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const mongoose = require("mongoose");
const path = require("path");

// --- Configuration ---
const SOURCE_MONGODB_URI = process.env.MONGODB_URI; // From scripts/.env (source DB)
const TARGET_DB_NAME = "aniway";
const COLLECTIONS_TO_MOVE = ["anime", "locations"];

// Helper function to get the base URI without the database name
function getBaseUri(uri) {
  const url = new URL(uri);
  url.pathname = "/"; // Remove database path
  return url.toString();
}

// --- Main Move Function ---
async function moveCollections() {
  if (!SOURCE_MONGODB_URI) {
    console.error("Error: MONGODB_URI is not defined in the .env file.");
    process.exit(1);
  }

  console.log(`Source URI: ${SOURCE_MONGODB_URI}`);
  console.log(`Target Database: ${TARGET_DB_NAME}`);

  let sourceConnection;
  try {
    // Connect to the source database
    console.log("Connecting to source MongoDB database...");
    sourceConnection = await mongoose
      .createConnection(SOURCE_MONGODB_URI)
      .asPromise();
    console.log("Connected to source MongoDB.");

    const sourceDb = sourceConnection.db;

    for (const collectionName of COLLECTIONS_TO_MOVE) {
      console.log(`\nProcessing collection: ${collectionName}...`);
      const sourceCollection = sourceDb.collection(collectionName);

      // Check if source collection exists
      const sourceExists = await sourceDb
        .listCollections({ name: collectionName })
        .hasNext();
      if (!sourceExists) {
        console.warn(
          `Source collection '${collectionName}' does not exist in the source database. Skipping.`
        );
        continue;
      }

      const sourceCount = await sourceCollection.countDocuments();
      console.log(
        `Source collection '${collectionName}' has ${sourceCount} documents.`
      );
      if (sourceCount === 0) {
        console.log(
          `Source collection '${collectionName}' is empty. Creating an empty collection in the target database.`
        );
        // Need to connect to target DB admin to ensure DB exists, then create empty collection
        const baseUri = getBaseUri(SOURCE_MONGODB_URI);
        const targetAdminUri = `${baseUri}admin${
          new URL(SOURCE_MONGODB_URI).search
        }`; // Connect to admin DB of target instance
        let targetAdminConnection;
        try {
          targetAdminConnection = await mongoose
            .createConnection(targetAdminUri)
            .asPromise();
          await targetAdminConnection
            .db(TARGET_DB_NAME)
            .createCollection(collectionName);
          console.log(
            `Empty collection '${collectionName}' created in database '${TARGET_DB_NAME}'.`
          );
        } catch (err) {
          console.error(
            `Error creating empty collection '${collectionName}' in target DB:`,
            err
          );
        } finally {
          if (targetAdminConnection) await targetAdminConnection.close();
        }
        continue; // Move to the next collection
      }

      // Define the aggregation pipeline to copy data
      const pipeline = [
        { $match: {} }, // Match all documents in the source collection
        {
          $out: { db: TARGET_DB_NAME, coll: collectionName }, // Output to the target DB and collection
        },
      ];

      console.log(
        `Executing aggregation pipeline to copy '${collectionName}' to database '${TARGET_DB_NAME}'...`
      );
      // $out requires execution, .toArray() or similar triggers it.
      await sourceCollection.aggregate(pipeline).toArray();
      console.log(
        `Successfully copied collection '${collectionName}' to database '${TARGET_DB_NAME}'.`
      );

      // Verification (optional but recommended)
      const baseUri = getBaseUri(SOURCE_MONGODB_URI);
      const targetDbUri = `${baseUri}${TARGET_DB_NAME}${
        new URL(SOURCE_MONGODB_URI).search
      }`;
      let targetConnection;
      try {
        targetConnection = await mongoose
          .createConnection(targetDbUri)
          .asPromise();
        const targetCount = await targetConnection.db
          .collection(collectionName)
          .countDocuments();
        console.log(
          `Target collection '${collectionName}' in '${TARGET_DB_NAME}' count: ${targetCount}`
        );
        if (sourceCount !== targetCount) {
          console.warn(
            `Warning: Document count mismatch for collection '${collectionName}'! Source: ${sourceCount}, Target: ${targetCount}`
          );
        }
      } catch (verifyError) {
        console.error(
          `Error verifying target collection '${collectionName}':`,
          verifyError
        );
      } finally {
        if (targetConnection) await targetConnection.close();
      }
    }

    console.log("\nCollection move process completed.");
  } catch (error) {
    console.error("\nAn error occurred during the move process:", error);
  } finally {
    if (sourceConnection) {
      await sourceConnection.close();
      console.log("Disconnected from source MongoDB.");
    }
  }
}

// Run the move function
moveCollections();
