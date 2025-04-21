// scripts/14_enrichAnime1WithTMDB.js
require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");

// --- Config ---
const MONGODB_URI = process.env.MONGODB_URI;
const TMDB_API_BEARER_TOKEN = process.env.TMDB_API_BEARER_TOKEN;
const COLLECTION_NAME = "anime1";
const TMDB_API_URL = "https://api.themoviedb.org/3/search/multi";
const BATCH_SIZE = 50; // How many updates to batch
const API_DELAY_MS = 200; // Delay between API calls (ms) to avoid rate limits

if (!MONGODB_URI || !TMDB_API_BEARER_TOKEN) {
  console.error(
    "Error: MONGODB_URI or TMDB_API_BEARER_TOKEN is not defined in the .env file."
  );
  process.exit(1);
}

// --- Mongoose Setup ---
const animeSchema = new mongoose.Schema(
  {},
  { strict: false, collection: COLLECTION_NAME }
);
const Anime1 = mongoose.model("Anime1Tmdb_Enrich", animeSchema); // Use a distinct model name

// Helper function for delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function enrichWithTMDB() {
  let connection;
  try {
    connection = await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully.");

    // --- Restore original filter: target unprocessed documents ---
    const filter = { tmdbEnriched: { $ne: true } };
    // -----------------------------------------------------------

    const totalDocsToProcess = await Anime1.countDocuments(filter);
    // Restore original log message
    console.log(
      `Found ${totalDocsToProcess} documents in '${COLLECTION_NAME}' to enrich with TMDB data.`
    );

    if (totalDocsToProcess === 0) {
      // Restore original log message
      console.log("No documents found in 'anime1' needing TMDB enrichment.");
      return;
    }

    const cursor = Anime1.find(filter).lean().cursor();

    let bulkOps = [];
    let processedCount = 0;
    let updatedCount = 0;
    let notFoundCount = 0; // Restore notFoundCount
    let errorCount = 0;

    const tmdbHeaders = {
      Authorization: `Bearer ${TMDB_API_BEARER_TOKEN}`,
      accept: "application/json",
    };

    for await (const doc of cursor) {
      processedCount++;
      const docId = doc._id; // Keep original _id for update filter

      // Determine search query (Updated logic: Always use 'name')
      let searchQuery = doc.name;
      if (!searchQuery || typeof searchQuery !== 'string' || !searchQuery.trim()) {
          console.warn(`[${processedCount}/${totalDocsToProcess}] Skipping doc ID ${docId}: Missing or invalid name.`);
          // Mark as processed to avoid retrying
          bulkOps.push({
              updateOne: {
                  filter: { _id: docId },
                  update: { $set: { tmdbEnriched: true } },
              },
          });
          continue; // Skip to next document
      }
      searchQuery = searchQuery.trim();

      console.log(
        `[${processedCount}/${totalDocsToProcess}] Processing ID ${docId}: Searching for "${searchQuery}"...`
      );

      try {
        await delay(API_DELAY_MS); // Wait before making the API call

        const response = await axios.get(TMDB_API_URL, {
          headers: tmdbHeaders,
          params: {
            query: searchQuery,
            include_adult: true, // As per your example curl
            language: "en-US",
            page: 1,
          },
          timeout: 10000, // 10 second timeout
        });

        const results = response.data?.results;

        if (results && results.length > 0) {
          // Use the first result as the best match
          let bestMatch = results[0];

          if (bestMatch) {
            // --- Restore original Full Update Logic ---
            const updateOps = {
              $set: {
                tmdbEnriched: true, // Mark as processed
              },
            };
            let usefulUpdate = false; // Track if we added more than just the flag

            // Add TMDB ID and type for reference
            if (bestMatch.id) updateOps.$set.tmdbId = bestMatch.id;
            if (bestMatch.media_type) updateOps.$set.tmdbMediaType = bestMatch.media_type;

            // Update overview
            if (bestMatch.overview && typeof bestMatch.overview === 'string' && bestMatch.overview.trim()) {
                updateOps.$set.overview = bestMatch.overview.trim();
                usefulUpdate = true;
            }

            // Conditionally update name_en if empty (using name OR title)
            let tmdbName = bestMatch.name || bestMatch.title;
            if ((!doc.name_en || String(doc.name_en).trim() === '') && tmdbName && typeof tmdbName === 'string' && tmdbName.trim()) {
              updateOps.$set.name_en = tmdbName.trim();
              console.log(`  -> Updating name_en from TMDB: "${updateOps.$set.name_en}"`);
              usefulUpdate = true;
            }

            // Conditionally update category if empty
             if ((!doc.category || String(doc.category).trim() === '') && bestMatch.media_type && ['tv', 'movie'].includes(bestMatch.media_type)) {
               updateOps.$set.category = bestMatch.media_type;
               console.log(`  -> Updating category from TMDB: "${updateOps.$set.category}"`);
               usefulUpdate = true;
             }

            // Update vote average and count
            if (typeof bestMatch.vote_average === 'number') {
                updateOps.$set.tmdbVoteAverage = bestMatch.vote_average;
                usefulUpdate = true;
            }
            if (typeof bestMatch.vote_count === 'number') {
                updateOps.$set.tmdbVoteCount = bestMatch.vote_count;
                usefulUpdate = true;
            }

            bulkOps.push({
                updateOne: {
                    filter: { _id: docId },
                    update: updateOps,
                },
            });
            
            if (usefulUpdate) {
                updatedCount++;
                console.log(`  -> Found TMDB match (ID: ${bestMatch.id}). Added update to batch.`);
            } else {
                notFoundCount++; // Count as 'not found' only if no useful data was added
                console.log(`  -> Found TMDB match (ID: ${bestMatch.id}) but no new useful data to add (already enriched?). Marked processed.`);
            }
            // --- End Restore Full Update Logic ---
            
          } else {
            console.log(`  -> No suitable TMDB match found in results for "${searchQuery}". Marking processed.`);
            // Mark as processed even if no match to avoid retrying
            bulkOps.push({
              updateOne: {
                filter: { _id: docId },
                update: { $set: { tmdbEnriched: true } },
              },
            });
            notFoundCount++;
          }
        } else {
          console.log(`  -> No TMDB results found for "${searchQuery}". Marking processed.`);
          // Mark as processed even if no results to avoid retrying
          bulkOps.push({
            updateOne: {
              filter: { _id: docId },
              update: { $set: { tmdbEnriched: true } },
            },
          });
          notFoundCount++;
        }
      } catch (error) {
        console.error(
          `  -> ERROR processing ID ${docId} for query "${searchQuery}":`,
          error.response?.data || error.message
        );
        errorCount++;
        // Do not mark as processed on error, allow retry next time
      }

      // Execute batch if full
      if (bulkOps.length >= BATCH_SIZE) {
        console.log(`--- Executing batch of ${bulkOps.length} operations... ---`);
        try {
            const result = await Anime1.bulkWrite(bulkOps);
            console.log(` -> Batch executed. Modified: ${result.modifiedCount}`);
            bulkOps = []; // Reset batch
        } catch(batchError) {
            console.error(" -> ERROR executing batch:", batchError);
            // Decide how to handle batch errors - potentially stop script or log and continue
            errorCount += bulkOps.length; // Approximate error count
            bulkOps = []; // Attempt to reset and continue
        }
      }
    } // End for await loop

    // Execute final batch
    if (bulkOps.length > 0) {
       console.log(`--- Executing final batch of ${bulkOps.length} operations... ---`);
       try {
           const result = await Anime1.bulkWrite(bulkOps);
           console.log(` -> Final batch executed. Modified: ${result.modifiedCount}`);
       } catch(batchError) {
            console.error(" -> ERROR executing final batch:", batchError);
            errorCount += bulkOps.length; // Approximate error count
       }
    }

    // Restore original Summary log messages
    console.log("\n--- TMDB Enrichment Summary ---");
    console.log(`Total documents checked: ${processedCount}`);
    console.log(`Documents updated with TMDB data: ${updatedCount}`);
    console.log(`Documents marked processed (no results/no useful data): ${notFoundCount}`);
    console.log(`Errors encountered (will be retried next run): ${errorCount}`);

  } catch (error) {
    console.error("An error occurred during the TMDB enrichment process:", error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }
  }
}

enrichWithTMDB();
