const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const mongoose = require("mongoose");
const fs = require("fs");

// Helper function to check if a string contains only basic ASCII characters
const isAscii = (str) => /^[\x00-\x7F]*$/.test(str);

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI; // Ensure MONGODB_URI points to your 'bangumi' database
const anitabiDataPath = path.join(__dirname, "anitabi.json");
const COLLECTION_NAME = "anime"; // Target collection name
const INVALID_TITLES = ["空作品，新建用", "Bangumi 番组计划"];

// --- Mongoose Setup ---
// Define a loose schema to accommodate various fields from the JSON
const animeSchema = new mongoose.Schema(
  {},
  { strict: false, collection: COLLECTION_NAME }
);
const Anime = mongoose.model("Anime", animeSchema);

const categoryMapping = {
  TV: "TV",
  游戏: "Game",
  小说: "Novel",
  剧场版: "Movie",
  漫画: "Manga",
  OVA: "OVA",
  Web: "Web",
  音乐: "Music",
  动画: "Animation",
  原创: "Original",
  其他: "Other",
  画集: "Artbook", // Added mapping
  // Add more mappings here if you find other values in your data
};

async function importData() {
  if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI is not defined in the .env file.");
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully.");

    // Read JSON file
    console.log(`Reading data from ${anitabiDataPath}...`);
    const jsonData = fs.readFileSync(anitabiDataPath, "utf-8");
    const allRecords = JSON.parse(jsonData);
    console.log(`Read ${allRecords.length} records from JSON file.`);

    // Filter records
    const validRecords = allRecords.filter((record) => {
      const title = record.title ? record.title.trim() : "";
      // const cat = record.cat ? record.cat.trim() : "";
      return title && !INVALID_TITLES.includes(title);
    });
    console.log(`Filtered down to ${validRecords.length} valid records.`);

    if (validRecords.length === 0) {
      console.log("No valid records to import.");
      return;
    }

    // --- Optional: Field Mapping/Transformation ---
    // If fields in anitabi.json need renaming or transformation before inserting
    // into the 'anime' collection, do it here.
    // Example: Map 'anitabi_id' to 'anitabiId'
    const transformedRecords = validRecords.map((record) => {
      // --- Determine name_en (prioritize English alias, then English title) ---
      let name_en = null;

      // 1. Check alias
      if (record.alias) {
        let potential_alias = null;
        if (
          Array.isArray(record.alias) &&
          record.alias.length > 0 &&
          typeof record.alias[0] === "string"
        ) {
          potential_alias = record.alias[0].trim();
        } else if (typeof record.alias === "string") {
          potential_alias = record.alias.trim();
        }

        if (potential_alias && isAscii(potential_alias)) {
          name_en = potential_alias; // Use alias if it's valid ASCII
        }
      }

      // 2. Check title if alias wasn't suitable
      if (
        name_en === null &&
        record.title &&
        typeof record.title === "string"
      ) {
        const potential_title = record.title.trim();
        if (potential_title && isAscii(potential_title)) {
          name_en = potential_title; // Use title if it's valid ASCII and alias wasn't
        }
      }
      // If neither alias nor title is valid ASCII, name_en remains null

      // --- Safely determine name_cn ---
      let name_cn = null;
      if (record.cn && typeof record.cn === "string" && record.cn.trim()) {
        name_cn = record.cn.trim();
      } else {
        // Optional: Log if cn is missing/invalid, but don't stop processing
        // console.warn(`Record ID ${record.id} has missing, empty, or non-string 'cn' field.`);
      }

      // --- Safely determine category ---
      const category_en =
        record.cat &&
        typeof record.cat === "string" &&
        categoryMapping[record.cat]
          ? categoryMapping[record.cat]
          : "Other"; // Default to 'Other' if cat is missing, not string, or not in map

      // --- Safely determine author/director ---
      const info =
        record.info && typeof record.info === "object" ? record.info : {}; // Ensure info is an object
      const author =
        info["作者"] && typeof info["作者"] === "string" ? info["作者"] : null;
      const director =
        info["导演"] && typeof info["导演"] === "string" ? info["导演"] : null;

      return {
        ...record,
        anitabiId: record.id,
        name_en: name_en, // Use the validated English name (or null)
        name_cn: name_cn, // Use the sanitized name_cn
        category: category_en, // Use the sanitized category
        author: author,
        director: director,
      };
    });

    // --- Upsert Records ---
    console.log(
      `Upserting ${transformedRecords.length} records into the '${COLLECTION_NAME}' collection...`
    );
    let successCount = 0;
    let errorCount = 0;
    for (const record of transformedRecords) {
      try {
        const updateResult = await Anime.updateOne(
          { anitabiId: record.anitabiId },
          { $set: record },
          { upsert: true }
        );
        successCount++;
      } catch (error) {
        console.error(
          `Error upserting record with anitabiId ${record.anitabiId}:`,
          error
        );
        errorCount++;
      }
    }
    console.log(`Successfully upserted ${successCount} records.`);
    if (errorCount > 0) {
      console.warn(`Failed to upsert ${errorCount} records.`);
    }
  } catch (error) {
    console.error("An error occurred during the import process:", error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
}

// Run the import function
importData();
