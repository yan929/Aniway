import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not defined in the .env file.");
  process.exit(1);
}

// Define minimal schemas needed for the script
const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    // Target fields to populate
    anime_name: [String],
    anime_name_en: [String],
    anime_name_cn: [String],
  },
  { strict: false, collection: "locations" }
);

const animeSchema = new mongoose.Schema(
  {
    name: String, // Original name
    name_en: String, // English name
    name_cn: String, // Chinese name
    locations: [
      {
        lat: Number,
        lng: Number,
      },
    ],
  },
  { strict: false, collection: "anime" }
);

// Function to clear existing data from target fields
async function clearExistingData(LocationModel) {
  console.log(
    "Clearing existing 'anime_name', 'anime_name_en', 'anime_name_cn' fields from locations collection..."
  );
  try {
    const result = await LocationModel.updateMany(
      {},
      { $unset: { anime_name: 1, anime_name_en: 1, anime_name_cn: 1 } }
    );
    console.log(
      ` -> Cleared fields from ${result.modifiedCount} documents (matched: ${result.matchedCount}).`
    );
  } catch (error) {
    console.error("Error clearing existing data:", error);
    throw error; // Re-throw to stop the script if clearing fails
  }
}

async function populateAnimeNames() {
  let connection;
  try {
    console.log("Connecting to MongoDB...");
    // Use createConnection like script 19
    connection = await mongoose
      .createConnection(MONGODB_URI, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000,
      })
      .asPromise();
    console.log(`MongoDB Connected: ${connection.name}`);

    // Get models from the connection object
    const Anime = connection.model("Anime", animeSchema);
    const Location = connection.model("Location", locationSchema);

    // Clear existing data
    await clearExistingData(Location);

    // --- Main processing logic ---
    console.log("Fetching all relevant anime documents...");
    // Select necessary fields including the different names
    const allAnime = await Anime.find({
      locations: { $exists: true, $ne: null, $not: { $size: 0 } },
      // Ensure at least one name field is present
      $or: [
        { name: { $exists: true, $ne: null, $ne: "" } },
        { name_en: { $exists: true, $ne: null, $ne: "" } },
        { name_cn: { $exists: true, $ne: null, $ne: "" } },
      ],
    })
      .select("_id name name_en name_cn locations")
      .lean();

    console.log(
      `Fetched ${allAnime.length} anime documents matching criteria.`
    );

    console.log("Processing fetched anime to collect location updates...");
    const locationUpdatesMap = new Map(); // Key: "lat,lng", Value: {lat, lng, names: Set, names_en: Set, names_cn: Set}

    let totalAnimeProcessed = 0;
    let totalUpdatesAttempted = 0;
    let totalUpdatesSucceeded = 0;

    for (const anime of allAnime) {
      totalAnimeProcessed++;
      const animeName = anime.name;
      const animeNameEn = anime.name_en;
      const animeNameCn = anime.name_cn;

      if (!anime.locations || anime.locations.length === 0) continue;

      for (const loc of anime.locations) {
        if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
          const coordKey = `${loc.lat},${loc.lng}`;

          if (!locationUpdatesMap.has(coordKey)) {
            locationUpdatesMap.set(coordKey, {
              lat: loc.lat,
              lng: loc.lng,
              names: new Set(),
              names_en: new Set(),
              names_cn: new Set(),
            });
          }

          const updateEntry = locationUpdatesMap.get(coordKey);
          // Add names only if they exist and are not empty strings
          if (animeName) updateEntry.names.add(animeName);
          if (animeNameEn) updateEntry.names_en.add(animeNameEn);
          if (animeNameCn) updateEntry.names_cn.add(animeNameCn);
        }
      } // End processing locations for one anime
    } // End processing all anime

    // Prepare individual updates based on the collected coordinate updates
    if (locationUpdatesMap.size > 0) {
      console.log(
        `Processing ${locationUpdatesMap.size} unique coordinates individually...`
      );
      let processedCount = 0;
      for (const [coordKey, updateData] of locationUpdatesMap.entries()) {
        if (
          updateData.names.size > 0 ||
          updateData.names_en.size > 0 ||
          updateData.names_cn.size > 0
        ) {
          totalUpdatesAttempted++;
          try {
            const updatePayload = {};
            if (updateData.names.size > 0)
              updatePayload.anime_name = Array.from(updateData.names);
            if (updateData.names_en.size > 0)
              updatePayload.anime_name_en = Array.from(updateData.names_en);
            if (updateData.names_cn.size > 0)
              updatePayload.anime_name_cn = Array.from(updateData.names_cn);

            const updateResult = await Location.findOneAndUpdate(
              { lat: updateData.lat, lng: updateData.lng }, // Filter
              { $set: updatePayload }, // Set all collected names
              { new: false } // Don't return the updated doc
            );
            if (updateResult) {
              totalUpdatesSucceeded++;
            } else {
              console.log(` -> Update failed for ${coordKey}`);
            }
          } catch (updateError) {
            console.error(
              ` -> Error updating location for ${coordKey}:`,
              updateError
            );
          }
        }
        processedCount++;
        if (
          processedCount % 100 === 0 ||
          processedCount === locationUpdatesMap.size
        ) {
          console.log(
            ` -> Processed ${processedCount} / ${locationUpdatesMap.size} coordinates...`
          );
        }
      }
      console.log("Finished individual updates.");
    } else {
      console.log(
        `No valid locations with coordinates found across all anime.`
      );
    }
    // --- End main processing logic ---

    console.log("\n--- Final Population Summary ---");
    console.log(`Total anime documents processed: ${totalAnimeProcessed}`);
    console.log(`Total updates attempted: ${totalUpdatesAttempted}`);
    console.log(`Total updates succeeded: ${totalUpdatesSucceeded}`);

    // --- Add Verification Step ---
    console.log("\n--- Verifying specific locations ---");
    // Example coordinates - adjust if needed based on expected data
    const coordsToVerify = [
      {
        lat: 35.6108,
        lng: 139.6259,
        expected_en:
          "['the Garden of sinners: Thanatos', 'The Garden of Sinners: A Study in Murder (Part 1)']",
      },
      {
        lat: 35.6619,
        lng: 139.7009,
        expected_en: "['22/7', \"Jellyfish Can't Swim in the Night\"]",
      },
      {
        lat: 35.5814,
        lng: 139.6758,
        expected_en: "['Clannad: The Motion Picture', 'Clannad']",
      },
      {
        lat: 41.2595,
        lng: 140.3451,
        expected_en: "['-The place promised in our early days-']",
      },
    ];
    for (const coord of coordsToVerify) {
      try {
        const loc = await Location.findOne({ lat: coord.lat, lng: coord.lng })
          .select("anime_name anime_name_en anime_name_cn lat lng") // Select new fields
          .lean();
        if (loc) {
          console.log(`Location (${coord.lat}, ${coord.lng}): Found.`);
          console.log(` -> anime_name:`, loc.anime_name);
          console.log(` -> anime_name_en:`, loc.anime_name_en);
          console.log(` -> anime_name_cn:`, loc.anime_name_cn);
          // Log expected english names for easier comparison with previous runs
          console.log(`  (Expected EN based on map log: ${coord.expected_en})`);
        } else {
          console.log(`Location (${coord.lat}, ${coord.lng}): NOT FOUND.`);
        }
      } catch (verifyError) {
        console.error(
          `Error verifying location (${coord.lat}, ${coord.lng}):`,
          verifyError
        );
      }
    }
    // --- End Verification Step ---
  } catch (error) {
    console.error("\nAn unexpected error occurred during the process:", error);
  } finally {
    console.log("\nClosing database connection...");
    if (connection && connection.readyState === 1) {
      await connection.close();
      console.log("MongoDB disconnected.");
    } else {
      console.log("Connection already closed or not established.");
    }
  }
}

populateAnimeNames();
