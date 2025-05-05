import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

// --- Configuration ---
const LOCAL_URI = process.env.MONGODB_URI;
const REMOTE_URI = process.env.REMOTE_MONGODB_URI;
const BATCH_SIZE = 100; // How many locations to process in one sync batch

// --- Mongoose Setup ---
// Schema including fields to read locally and sync remotely
const locationSyncSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    gmap_nearby_response: mongoose.Schema.Types.Mixed, // Field to sync
    isValid: Boolean, // Field to sync
    nearby: mongoose.Schema.Types.Mixed, // Field to sync (assuming it's an array or object)
    nearby_extracted: Boolean, // Read: Ensure previous script ran
    nearby_synced_to_remote: { type: Boolean, default: false }, // Write: Flag for this script
  },
  { strict: false, _id: false }
); // Allow other fields, don't manage _id within schema definition here

// --- Helper: Create Connection ---
async function createConnection(uri, dbName) {
  if (!uri) {
    console.error(`Error: ${dbName} MongoDB URI must be set in .env file.`);
    throw new Error(`Missing URI for ${dbName}`);
  }
  console.log(`Connecting to ${dbName} MongoDB...`);
  const connection = await mongoose.createConnection(uri).asPromise();
  console.log(`Connected to ${dbName} MongoDB.`);
  return connection;
}

// --- Main Execution ---
async function main() {
  let localConnection;
  let remoteConnection;

  try {
    // Establish connections
    localConnection = await createConnection(LOCAL_URI, "Local");
    remoteConnection = await createConnection(REMOTE_URI, "Remote");

    // Create models on respective connections
    const LocalLocation = localConnection.model(
      "LocalLocationForSync",
      locationSyncSchema,
      "locations"
    );
    const RemoteLocation = remoteConnection.model(
      "RemoteLocationForSync",
      locationSyncSchema,
      "locations"
    );

    let totalProcessed = 0;
    let totalSynced = 0;
    let totalMarkedLocally = 0;
    let hasMore = true;
    let batchNum = 0;

    console.log("\nStarting Nearby Data Sync to Remote process...");

    while (hasMore) {
      batchNum++;
      console.log(`--- Processing Sync Batch ${batchNum} ---`);

      // 1. Find locations locally that need syncing
      const locationsToSync = await LocalLocation.find({
        nearby_extracted: true, // Ensure validation script ran
        nearby_synced_to_remote: { $ne: true }, // Not yet synced
      })
        .select("_id gmap_nearby_response isValid nearby") // Select only needed fields
        .limit(BATCH_SIZE)
        .lean(); // Use lean for performance as we don't need Mongoose documents here

      if (locationsToSync.length === 0) {
        console.log("No more locations found to sync.");
        hasMore = false;
        break;
      }

      console.log(
        `Found ${locationsToSync.length} locations to sync in batch ${batchNum}.`
      );
      totalProcessed += locationsToSync.length;

      // 2. Prepare bulk operations for remote update
      const remoteBulkOps = locationsToSync.map((loc) => ({
        updateOne: {
          filter: { _id: loc._id },
          update: {
            $set: {
              gmap_nearby_response: loc.gmap_nearby_response,
              isValid: loc.isValid,
              nearby: loc.nearby,
              // We don't set nearby_synced_to_remote on the remote DB
            },
          },
          upsert: false, // Don't create if not found
        },
      }));

      // 3. Execute remote bulk write
      let remoteUpdateResult = null;
      if (remoteBulkOps.length > 0) {
        try {
          remoteUpdateResult = await RemoteLocation.bulkWrite(remoteBulkOps, {
            ordered: false,
          });
          console.log(
            `  -> Remote Bulk Write: Matched: ${remoteUpdateResult.matchedCount}, Modified: ${remoteUpdateResult.modifiedCount}`
          );
          totalSynced += remoteUpdateResult.modifiedCount || 0;
        } catch (remoteError) {
          console.error("  -> Error during remote bulk write:", remoteError);
          // Handle error - e.g., stop the script or skip the batch?
          // For now, log and attempt to mark local docs anyway to avoid re-attempting failed syncs
          // Alternatively, could 'continue' to skip marking locally if remote failed.
        }
      }

      // 4. Prepare bulk operations for local update (mark as synced)
      // Only mark locally if the remote operation was attempted (even if it failed, depending on strategy)
      const localBulkOps = locationsToSync.map((loc) => ({
        updateOne: {
          filter: { _id: loc._id },
          update: {
            $set: { nearby_synced_to_remote: true },
          },
        },
      }));

      // 5. Execute local bulk write
      if (localBulkOps.length > 0) {
        try {
          const localResult = await LocalLocation.bulkWrite(localBulkOps, {
            ordered: false,
          });
          console.log(
            `  -> Local Bulk Write (Mark Synced): Matched: ${localResult.matchedCount}, Modified: ${localResult.modifiedCount}`
          );
          totalMarkedLocally += localResult.modifiedCount || 0;
        } catch (localError) {
          console.error(
            "  -> Error during local bulk write (marking synced):",
            localError
          );
          // Critical error if we can't mark locally, might lead to re-sync attempts
        }
      }

      console.log(
        `Batch ${batchNum} finished. Total processed so far: ${totalProcessed}`
      );
    }

    console.log("\n--- Sync Summary ---");
    console.log(`Total locations processed for syncing: ${totalProcessed}`);
    console.log(`Total documents modified on Remote DB: ${totalSynced}`);
    console.log(
      `Total documents marked as synced on Local DB: ${totalMarkedLocally}`
    );
    console.log("--------------------\n");
  } catch (error) {
    console.error("Unhandled error during script execution:", error);
  } finally {
    // Ensure connections are closed
    if (localConnection) {
      await localConnection.close();
      console.log("Disconnected from Local MongoDB.");
    }
    if (remoteConnection) {
      await remoteConnection.close();
      console.log("Disconnected from Remote MongoDB.");
    }
  }
}

main().catch((err) => {
  console.error("Error caught in main promise chain:", err);
  // Connections should be closed by finally block
  process.exit(1);
});
