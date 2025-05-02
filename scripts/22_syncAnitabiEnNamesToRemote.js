import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const LOCAL_URI = process.env.MONGODB_URI;
const REMOTE_URI = process.env.REMOTE_MONGODB_URI;
const BATCH_SIZE = 500; // Number of documents to process in each batch

if (!LOCAL_URI || !REMOTE_URI) {
  console.error(
    "Error: MONGODB_URI and REMOTE_MONGODB_URI must be defined in the .env file."
  );
  process.exit(1);
}

// Define a minimal schema just for the fields we need
const locationSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    anime_name: [String],
    anime_name_en: [String],
    anime_name_cn: [String],
  },
  { strict: false, collection: "locations" }
);

async function syncAnitabiEnNames() {
  let localConn;
  let remoteConn;

  try {
    console.log("Connecting to Local MongoDB...");
    localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log(`Local MongoDB Connected: ${localConn.name}`);
    const LocalLocation = localConn.model("Location", locationSchema);

    console.log("Connecting to Remote MongoDB...");
    remoteConn = await mongoose.createConnection(REMOTE_URI).asPromise();
    console.log(`Remote MongoDB Connected: ${remoteConn.name}`);
    const RemoteLocation = remoteConn.model("Location", locationSchema);

    console.log("Starting sync of 'anime_name', 'anime_name_en', 'anime_name_cn' from Local to Remote...");

    let totalDocsProcessed = 0;
    let totalDocsSynced = 0;
    let page = 0;

    while (true) {
      const skip = page * BATCH_SIZE;
      console.log(`Fetching local locations batch ${page + 1} (skip: ${skip})...`);

      const localLocations = await LocalLocation.find({
        // Only sync docs where at least one of the target fields exists locally
        $or: [
          { anime_name: { $exists: true, $ne: null } },
          { anime_name_en: { $exists: true, $ne: null } },
          { anime_name_cn: { $exists: true, $ne: null } },
        ]
      })
        .select("_id anime_name anime_name_en anime_name_cn") // Select the fields to sync
        .skip(skip)
        .limit(BATCH_SIZE)
        .lean();

      if (localLocations.length === 0) {
        console.log("No more local locations with relevant anime name fields found.");
        break;
      }

      console.log(`Processing ${localLocations.length} local documents...`);
      totalDocsProcessed += localLocations.length;
      let bulkOps = [];

      for (const loc of localLocations) {
        // Prepare the update payload, including fields even if they are null/empty locally 
        // to ensure the remote document mirrors the local one.
        const updatePayload = {
          anime_name: loc.anime_name || [],
          anime_name_en: loc.anime_name_en || [],
          anime_name_cn: loc.anime_name_cn || [],
        };

        if (loc._id) { // Check if _id exists
          bulkOps.push({
            updateOne: {
              filter: { _id: loc._id }, // Match by _id
              update: { $set: updatePayload }, // Set all three fields
              // Consider adding upsert: false if you ONLY want to update existing docs
            },
          });
        }
      }

      if (bulkOps.length > 0) {
        console.log(`Executing batch of ${bulkOps.length} updates to remote...`);
        try {
          const result = await RemoteLocation.bulkWrite(bulkOps, { ordered: false });
          const modifiedCount = result.modifiedCount || 0;
          console.log(
            ` -> Remote Batch update result: Matched: ${result.matchedCount}, Modified: ${modifiedCount}`
          );
          totalDocsSynced += modifiedCount; // Count successful modifications

          if (result.hasWriteErrors()) {
            console.warn(
              ` -> Remote Batch encountered write errors:`,
              result.getWriteErrors()
            );
          }
        } catch (bulkWriteError) {
          console.error(` -> Error during remote bulk write:`, bulkWriteError);
        }
      } else {
        console.log("No operations prepared for this batch.");
      }

      page++;
    } // End while loop

    console.log("\n--- Sync Summary ---");
    console.log(`Total local documents processed: ${totalDocsProcessed}`);
    console.log(`Total documents successfully synced to remote: ${totalDocsSynced}`);

  } catch (error) {
    console.error("\nAn unexpected error occurred during the sync process:", error);
  } finally {
    console.log("\nClosing database connections...");
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

syncAnitabiEnNames();
