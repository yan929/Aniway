// scripts/13_copyAnimeWithLocations.js
require("dotenv").config();
const mongoose = require("mongoose");

// --- Config ---
const MONGODB_URI = process.env.MONGODB_URI;
const SOURCE_COLLECTION_NAME = "anime";
const TARGET_COLLECTION_NAME = "anime1";
const BATCH_SIZE = 100; // How many documents to insert at once

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not defined in the .env file.");
  process.exit(1);
}

// --- Mongoose Setup ---
// Use strict: false as we are projecting fields dynamically
const animeSchema = new mongoose.Schema(
  {},
  { strict: false, collection: SOURCE_COLLECTION_NAME }
);
const Anime = mongoose.model("AnimeSource", animeSchema); // Use a distinct model name for source

const anime1Schema = new mongoose.Schema(
  {},
  { strict: false, collection: TARGET_COLLECTION_NAME }
);
const Anime1 = mongoose.model(TARGET_COLLECTION_NAME, anime1Schema); // Model for the target collection

async function copyAnimeWithLocations() {
  let connection;
  try {
    connection = await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully.");

    console.log(
      `Querying '${SOURCE_COLLECTION_NAME}' for documents with locations...`
    );

    // Fields to exclude in the projection (used by query, but we'll double-check manually)
    const projection = {
      _id: 0, // Exclude original _id, let MongoDB generate a new one for anime1
      __v: 0,
      release: 0,
      anitabiLocationsProcessed: 0,
      modified: 0,
      color: 0,
      sticky: 0,
      week: 0,
      zoon: 0,
      cn: 0,
      cat: 0,
      en: 0,
    };

    // Use a cursor for memory efficiency with potentially large datasets
    const cursor = Anime.find({ "locations.0": { $exists: true } }) // Find docs with non-empty locations array
      .select(projection) // Apply the projection to exclude fields
      .lean() // Get plain JavaScript objects
      .cursor(); // Get a cursor

    let batchToInsert = [];
    let totalCopied = 0;
    let documentsProcessed = 0;

    // Define keys to manually delete as a fallback/guarantee
    const keysToDelete = [
      "_id",
      "__v",
      "release",
      "anitabiLocationsProcessed",
      "modified",
      "color",
      "sticky",
      "week",
      "zoon",
      "cn",
      "cat",
    ];

    let hasLoggedDoc = false; // Flag to log only the first doc

    console.log(`Starting copy process to '${TARGET_COLLECTION_NAME}'...`);

    for await (const doc of cursor) {
      documentsProcessed++;

      // Manually delete the unwanted keys from the JS object
      for (const key of keysToDelete) {
        delete doc[key];
      }

      // --- Rename fields ---
      if (doc.hasOwnProperty("title")) {
        // Check if title exists before renaming
        doc.name = doc.title;
        delete doc.title;
      }
      if (doc.hasOwnProperty("description")) {
        // Check if description exists
        doc.summary = doc.description;
        delete doc.description;
      }
      if (doc.hasOwnProperty("anitabiId")) {
        doc.bangumi_id = doc.anitabiId;
        delete doc.anitabiId;
      }
      // --- End Rename ---

      // --- Prefix relative URLs ---
      const prefix = "https://anitabi.cn";
      if (
        doc.cover &&
        typeof doc.cover === "string" &&
        !doc.cover.startsWith("http")
      ) {
        doc.cover = prefix + doc.cover;
      }
      if (
        doc.icon &&
        typeof doc.icon === "string" &&
        !doc.icon.startsWith("http")
      ) {
        doc.icon = prefix + doc.icon;
      }
      // --- End Prefix ---

      // --- DEBUG: Log keys of the first processed document ---
      if (!hasLoggedDoc) {
        console.log(
          "--- DEBUG: Keys in first doc after deletion/rename:",
          Object.keys(doc)
        );
        hasLoggedDoc = true;
      }
      // --- END DEBUG ---

      batchToInsert.push(doc); // Push the cleaned and renamed doc

      if (batchToInsert.length >= BATCH_SIZE) {
        const insertResult = await Anime1.insertMany(batchToInsert);
        totalCopied += insertResult.length;
        console.log(` -> Inserted batch of ${insertResult.length} documents.`);
        batchToInsert = []; // Reset batch
      }
    }

    // Insert any remaining documents in the last batch
    if (batchToInsert.length > 0) {
      const insertResult = await Anime1.insertMany(batchToInsert);
      totalCopied += insertResult.length;
      console.log(
        ` -> Inserted final batch of ${insertResult.length} documents.`
      );
    }

    console.log("\n--- Copy Summary ---");
    console.log(`Total documents checked in source: ${documentsProcessed}`);
    console.log(
      `Total documents copied to '${TARGET_COLLECTION_NAME}': ${totalCopied}`
    );
  } catch (error) {
    console.error("An error occurred during the copy process:", error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }
  }
}

copyAnimeWithLocations();
