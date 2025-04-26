// scripts/15_extractLocationsFromAnime1.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const MONGODB_URI = process.env.MONGODB_URI;
const SOURCE_COLLECTION_NAME = "anime1";
const TARGET_COLLECTION_NAME = "locations_v2"; // Using v2 to avoid conflict with existing 'locations'

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not defined in .env file.");
  process.exit(1);
}

// Source Schema (minimal)
const anime1Schema = new mongoose.Schema(
  {
    locations: [
      {
        id: String,
        cn: String,
        name: String,
        image: String,
        ep: Number, // Will be dropped
        s: Number, // Will be dropped
        geo: { type: [Number], index: "2d" }, // [lat, lng]
        origin: String,
        originURL: String,
      },
    ],
  },
  { strict: false, collection: SOURCE_COLLECTION_NAME }
);

// Target Schema
const locationV2Schema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    originIds: [String], // Store original Anitabi location IDs associated with this lat/lng
    anitabi_names: [String], // Store corresponding names
    anitabi_cn_names: [String], // Store corresponding CN names
    images: [String], // Store unique image URLs
    origins: [String], // Store unique origins
    originURLs: [String], // Store unique origin URLs
    gmap_processed: { type: Boolean, default: false }, // For the enrichment step
  },
  {
    collection: TARGET_COLLECTION_NAME,
    timestamps: true, // Add createdAt/updatedAt
  }
);

// Create compound index for upserting based on coordinates
locationV2Schema.index({ lat: 1, lng: 1 }, { unique: true });

const Anime1 = mongoose.model("Anime1ForLocationExtract", anime1Schema);
const LocationV2 = mongoose.model("LocationV2", locationV2Schema);

const BATCH_SIZE = 500; // How many location updates to batch for bulkWrite

async function extractLocations() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully.");

    console.log(
      `Starting extraction from '${SOURCE_COLLECTION_NAME}' to '${TARGET_COLLECTION_NAME}'...`
    );

    const cursor = Anime1.find({
      locations: { $exists: true, $ne: null, $not: { $size: 0 } }, // Only process docs with locations
    })
      .select("locations") // Only fetch the locations field
      .lean()
      .cursor();

    let bulkOps = [];
    let animeDocsProcessed = 0;
    let locationsExtracted = 0;
    let uniqueLocationsUpserted = 0; // Will be reflected in bulkWrite result

    for await (const animeDoc of cursor) {
      animeDocsProcessed++;
      if (!animeDoc.locations || animeDoc.locations.length === 0) {
        continue;
      }

      for (const loc of animeDoc.locations) {
        // Validate geo data
        if (
          !loc.geo ||
          !Array.isArray(loc.geo) ||
          loc.geo.length !== 2 ||
          typeof loc.geo[0] !== "number" ||
          typeof loc.geo[1] !== "number"
        ) {
          // console.warn(`Skipping location with invalid geo data in anime doc: ${animeDoc._id}, loc id: ${loc.id}`);
          continue;
        }

        locationsExtracted++;
        const lat = loc.geo[0];
        const lng = loc.geo[1];

        // Prepare update operation for upsert
        const updateOp = {
          updateOne: {
            filter: { lat: lat, lng: lng },
            update: {
              $setOnInsert: { lat: lat, lng: lng, gmap_processed: false }, // Set fields only on insert
              $addToSet: {
                // Add unique values to arrays
                originIds: loc.id,
                ...(loc.name && { anitabi_names: loc.name }),
                ...(loc.cn && { anitabi_cn_names: loc.cn }),
                ...(loc.image && { images: loc.image }),
                ...(loc.origin && { origins: loc.origin }),
                ...(loc.originURL && { originURLs: loc.originURL }),
              },
            },
            upsert: true,
          },
        };
        bulkOps.push(updateOp);

        // Execute batch if size is reached
        if (bulkOps.length >= BATCH_SIZE) {
          console.log(
            `Processed ${animeDocsProcessed} anime docs. Executing batch of ${bulkOps.length} location upserts...`
          );
          const result = await LocationV2.bulkWrite(bulkOps);
          uniqueLocationsUpserted += result.upsertedCount; // Add count of new unique locations
          console.log(
            ` -> Batch executed. Upserted: ${result.upsertedCount}, Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`
          );
          bulkOps = []; // Reset batch
        }
      }
      if (animeDocsProcessed % 100 === 0) {
        console.log(
          `Processed ${animeDocsProcessed} anime documents... Extracted ${locationsExtracted} locations so far.`
        );
      }
    }

    // Execute any remaining operations
    if (bulkOps.length > 0) {
      console.log(
        `Executing final batch of ${bulkOps.length} location upserts...`
      );
      const result = await LocationV2.bulkWrite(bulkOps);
      uniqueLocationsUpserted += result.upsertedCount;
      console.log(
        ` -> Final batch executed. Upserted: ${result.upsertedCount}, Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`
      );
    }

    console.log("\n--- Location Extraction Summary ---");
    console.log(`Total anime documents processed: ${animeDocsProcessed}`);
    console.log(`Total locations extracted from arrays: ${locationsExtracted}`);
    // Note: Upserted count reflects truly unique locations added to locations_v2
    console.log(
      `Unique locations created in '${TARGET_COLLECTION_NAME}': ${uniqueLocationsUpserted}`
    );
  } catch (error) {
    console.error("An error occurred during location extraction:", error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }
  }
}

extractLocations();
