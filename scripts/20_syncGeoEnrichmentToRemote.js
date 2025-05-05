import "dotenv/config";
import mongoose from "mongoose";

// --- Configuration ---
const LOCAL_URI = process.env.MONGODB_URI;
const REMOTE_URI = process.env.REMOTE_MONGODB_URI;
const BATCH_SIZE = 100; // Process 100 documents at a time

if (!LOCAL_URI || !REMOTE_URI) {
  console.error(
    "Error: MONGODB_URI and REMOTE_MONGODB_URI must be set in .env"
  );
  process.exit(1);
}

// --- Mongoose Setup ---

// Define a loose schema for flexibility, especially for the remote side
const locationSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "locations" }
);

let localConn, remoteConn;
let LocalLocation, RemoteLocation;

async function connectDBs() {
  try {
    console.log("Connecting to Local MongoDB...");
    localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    LocalLocation = localConn.model("Location", locationSchema);
    console.log("Local MongoDB connected.");

    console.log("Connecting to Remote MongoDB...");
    remoteConn = await mongoose.createConnection(REMOTE_URI).asPromise();
    RemoteLocation = remoteConn.model("Location", locationSchema);
    console.log("Remote MongoDB connected.");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
}

// --- Main Sync Logic ---
async function syncGeoData() {
  await connectDBs();

  let totalSynced = 0;
  let totalErrors = 0;
  let hasMore = true;

  console.log("\n--- Starting Geo Enrichment Sync to Remote ---");

  try {
    while (hasMore) {
      console.log("\nFetching next batch of unsynced documents...");
      const localLocationsToSync = await LocalLocation.find({
        geoEnriched: true,
        geoSyncedToRemote: { $ne: true }, // Find unsynced docs
      })
        .select("_id lat lng gmap_raw_response country city geoEnriched") // Select necessary fields
        .limit(BATCH_SIZE)
        .lean(); // Use lean for performance

      if (localLocationsToSync.length === 0) {
        console.log("No more unsynced locations found.");
        hasMore = false;
        continue;
      }

      console.log(
        `Processing ${localLocationsToSync.length} locations in this batch...`
      );

      const remoteBulkOps = [];
      const localBulkOps = [];
      const successfullyProcessedIds = [];

      for (const localLoc of localLocationsToSync) {
        if (localLoc.lat == null || localLoc.lng == null) {
          console.warn(
            `Skipping local doc ID ${localLoc._id}: Missing lat/lng.`
          );
          // Mark as synced locally anyway to avoid retrying
          localBulkOps.push({
            updateOne: {
              filter: { _id: localLoc._id },
              update: { $set: { geoSyncedToRemote: true } },
            },
          });
          continue;
        }

        // Prepare remote update
        remoteBulkOps.push({
          updateOne: {
            filter: { lat: localLoc.lat, lng: localLoc.lng },
            update: {
              $set: {
                gmap_raw_response: localLoc.gmap_raw_response,
                country: localLoc.country,
                city: localLoc.city,
              },
            },
            upsert: false, // Don't create new docs remotely if no match
          },
        });
        // Store ID to update locally *after* successful remote push
        successfullyProcessedIds.push(localLoc._id);
      }

      // --- Execute Remote Updates ---
      if (remoteBulkOps.length > 0) {
        try {
          console.log(
            `Executing ${remoteBulkOps.length} update operations on remote...`
          );
          const remoteResult = await RemoteLocation.bulkWrite(remoteBulkOps, {
            ordered: false,
          });
          console.log(
            ` -> Remote Batch Executed. Matched: ${remoteResult.matchedCount}, Modified: ${remoteResult.modifiedCount}`
          );
          totalSynced += remoteResult.modifiedCount; // Count actual modifications remotely

          // --- Execute Local Updates for Successfully Pushed Docs ---
          if (successfullyProcessedIds.length > 0) {
            const localUpdateOps = successfullyProcessedIds.map((id) => ({
              updateOne: {
                filter: { _id: id },
                update: { $set: { geoSyncedToRemote: true } },
              },
            }));

            console.log(
              `Executing ${localUpdateOps.length} update operations on local to mark as synced...`
            );
            const localResult = await LocalLocation.bulkWrite(localUpdateOps, {
              ordered: false,
            });
            console.log(
              ` -> Local Batch Executed. Matched: ${localResult.matchedCount}, Modified: ${localResult.modifiedCount}`
            );
          } else {
            console.log("No local documents needed marking in this batch.");
          }
        } catch (bulkError) {
          console.error("Error during remote bulkWrite:", bulkError);
          totalErrors += remoteBulkOps.length; // Estimate errors
          // Don't mark local docs as synced if remote update failed
          console.error(
            "Skipping local sync flag update for this batch due to remote error."
          );
        }
      } else {
        console.log("No remote operations to execute for this batch.");
        // Still need to mark skipped local docs
        if (localBulkOps.length > 0) {
          try {
            console.log(
              `Executing ${localBulkOps.length} update operations on local for skipped docs...`
            );
            const localResultSkipped = await LocalLocation.bulkWrite(
              localBulkOps,
              { ordered: false }
            );
            console.log(
              ` -> Local Skipped Batch Executed. Matched: ${localResultSkipped.matchedCount}, Modified: ${localResultSkipped.modifiedCount}`
            );
          } catch (localSkipError) {
            console.error("Error updating local skipped docs:", localSkipError);
          }
        }
      }

      // The loop continues until find returns 0 documents matching the filter.
    } // End while loop

    console.log("\n--- Geo Enrichment Sync Summary ---");
    console.log(`Total remote locations updated/modified: ${totalSynced}`);
    console.log(`Estimated errors during processing: ${totalErrors}`);
  } catch (error) {
    console.error("An error occurred during the sync process:", error);
  } finally {
    console.log("Closing database connections...");
    if (localConn && localConn.readyState === 1) {
      await localConn.close();
      console.log("Local MongoDB disconnected.");
    }
    if (remoteConn && remoteConn.readyState === 1) {
      await remoteConn.close();
      console.log("Remote MongoDB disconnected.");
    }
  }
}

syncGeoData(); // Run the sync function
