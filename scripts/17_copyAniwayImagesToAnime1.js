// scripts/19_copyAniwayImagesToAnime1.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI_BASE = process.env.MONGODB_URI; // Should be like mongodb://user:pass@host?options
// Assuming 'aniway.anime' refers to collection 'anime' in the 'aniway' database
const SOURCE_DB_NAME = "aniway";
const SOURCE_COLLECTION_NAME = "anime";
// Assuming 'bangumi.anime1' refers to collection 'anime1' in the 'bangumi' database
const TARGET_DB_NAME = "bangumi";
const TARGET_COLLECTION_NAME = "anime1";

if (!MONGODB_URI_BASE) {
  console.error("Error: MONGODB_URI is not defined in .env file.");
  process.exit(1);
}

// Function to construct DB specific URI
function constructDbUri(baseUri, dbName) {
    const uri = new URL(baseUri);
    uri.pathname = `/${dbName}`;
    return uri.toString();
}

const MONGODB_URI_ANIWAY = constructDbUri(MONGODB_URI_BASE, SOURCE_DB_NAME);
const MONGODB_URI_BANGUMI = constructDbUri(MONGODB_URI_BASE, TARGET_DB_NAME);

// Source Schema (Minimal - from 'aniway.anime' collection)
// We assume 'images' could be any structure, hence Mixed.
const sourceAnimeSchema = new mongoose.Schema(
  {
    bangumi_id: { type: Number, required: true, index: true },
    images: mongoose.Schema.Types.Mixed,
  },
  { collection: SOURCE_COLLECTION_NAME, strict: false }
);

// Target Schema (Minimal - for 'bangumi.anime1' collection)
// Includes the 'images' field to be added/updated.
const targetAnimeSchema = new mongoose.Schema(
  {
    bangumi_id: { type: Number, required: true, index: true },
    images: mongoose.Schema.Types.Mixed, // Add the new field
  },
  { collection: TARGET_COLLECTION_NAME, strict: false }
);

// --- Define Models on Specific Connections (will be done after connection) ---
let SourceAnime;
let TargetAnime;
// ---------------------------------------------------------------------------

const BATCH_SIZE = 500; // Number of updates to perform in one bulk operation

async function copyImages() {
  let aniwayConn;
  let bangumiConn;
  try {
    // Establish connections to both databases
    console.log(`Connecting to source DB (${SOURCE_DB_NAME})...`);
    aniwayConn = await mongoose.createConnection(MONGODB_URI_ANIWAY).asPromise();
    console.log(`Connected to source DB: ${aniwayConn.name}`);

    console.log(`Connecting to target DB (${TARGET_DB_NAME})...`);
    bangumiConn = await mongoose.createConnection(MONGODB_URI_BANGUMI).asPromise();
    console.log(`Connected to target DB: ${bangumiConn.name}`);

    // Define models on their respective connections
    SourceAnime = aniwayConn.model("SourceAnimeForImageCopy", sourceAnimeSchema);
    TargetAnime = bangumiConn.model("TargetAnimeForImageCopy", targetAnimeSchema);

    console.log(`Fetching images data from source collection '${SOURCE_DB_NAME}.${SOURCE_COLLECTION_NAME}'...`);

    // Step 1: Fetch all necessary image data from the source collection into a Map.
    // Key: bangumi_id, Value: images field content
    const imageMap = new Map();
    const sourceCursor = SourceAnime.find({
      bangumi_id: { $exists: true, $ne: null },
      images: { $exists: true, $ne: null }, // Only fetch docs where images field exists and is not null
    })
      .select("bangumi_id images") // Select only needed fields
      .lean() // Use lean for performance
      .cursor();

    let sourceDocsProcessed = 0;
    for await (const doc of sourceCursor) {
        // Optional: Add check if imagesData is meaningful (e.g., not empty object/array)
        const imagesData = doc.images;
        const hasImageData = imagesData &&
                             (typeof imagesData !== 'object' || Object.keys(imagesData).length > 0) &&
                             (!Array.isArray(imagesData) || imagesData.length > 0);

        if (hasImageData) {
            imageMap.set(doc.bangumi_id, imagesData);
        }
        sourceDocsProcessed++;
        if (sourceDocsProcessed % 5000 === 0) {
             console.log(` -> Processed ${sourceDocsProcessed} source documents... Found images for ${imageMap.size} unique bangumi_ids.`);
        }
    }
    console.log(`Finished fetching source data. Found images for ${imageMap.size} unique bangumi_ids.`);

    if (imageMap.size === 0) {
        console.log("No source documents with images found. No updates needed for target collection.");
        return;
    }

    console.log(`Starting update process for target collection '${TARGET_DB_NAME}.${TARGET_COLLECTION_NAME}'...`);

    // Step 2: Iterate through the target collection and prepare updates.
    const targetCursor = TargetAnime.find({
      bangumi_id: { $exists: true, $ne: null }, // Ensure target has a bangumi_id to match
    })
      .select("_id bangumi_id") // Only fetch _id and bangumi_id
      .lean()
      .cursor();

    let bulkOps = [];
    let targetDocsProcessed = 0;
    let targetDocsUpdated = 0;

    for await (const targetDoc of targetCursor) {
      targetDocsProcessed++;

      // Check if the target's bangumi_id exists in our image map
      if (imageMap.has(targetDoc.bangumi_id)) {
        const imagesToCopy = imageMap.get(targetDoc.bangumi_id);
        // Add an update operation to the bulk list
        bulkOps.push({
          updateOne: {
            filter: { _id: targetDoc._id }, // Match by document _id
            update: { $set: { images: imagesToCopy } }, // Set the images field
          },
        });
        targetDocsUpdated++;

        // Execute the batch if it reaches the BATCH_SIZE
        if (bulkOps.length >= BATCH_SIZE) {
          console.log(`Processed ${targetDocsProcessed} target docs. Executing batch update for ${bulkOps.length} documents...`);
          try {
            const result = await TargetAnime.bulkWrite(bulkOps);
            console.log(` -> Batch executed. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
          } catch (bulkError) {
             console.error("Error executing bulkWrite:", bulkError);
             // Consider adding retry logic or skipping the batch on error
          }
          bulkOps = []; // Reset the bulk operations array
        }
      }

      // Log progress periodically
      if (targetDocsProcessed % 1000 === 0) {
         console.log(`Processed ${targetDocsProcessed} target documents... Updates prepared for ${targetDocsUpdated}.`);
      }
    }

    // Execute any remaining operations in the final batch
    if (bulkOps.length > 0) {
      console.log(`Executing final batch of ${bulkOps.length} updates...`);
       try {
            const result = await TargetAnime.bulkWrite(bulkOps);
            console.log(` -> Final batch executed. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
          } catch (bulkError) {
             console.error("Error executing final bulkWrite:", bulkError);
          }
    }

    console.log("\n--- Image Copy Summary ---");
    console.log(`Total target documents processed: ${targetDocsProcessed}`);
    console.log(`Target documents updated with images: ${targetDocsUpdated}`);

  } catch (error) {
    console.error("An error occurred during the image copy process:", error);
  } finally {
    // Ensure the database connections are closed
    if (aniwayConn && aniwayConn.readyState === 1) {
        await aniwayConn.close();
        console.log(`Source DB connection (${aniwayConn.name}) closed.`);
    }
    if (bangumiConn && bangumiConn.readyState === 1) {
        await bangumiConn.close();
        console.log(`Target DB connection (${bangumiConn.name}) closed.`);
    }
  }
}

copyImages();
