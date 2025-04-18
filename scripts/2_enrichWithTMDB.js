require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI;
const TMDB_API_BEARER_TOKEN = process.env.TMDB_API_BEARER_TOKEN;
const TMDB_SEARCH_URL = "https://api.themoviedb.org/3/search/movie";
const RATE_LIMIT_DELAY_MS = 250; // Delay between TMDB API calls (4 calls/sec approx)
const BATCH_SIZE = 10; // Number of subjects to process per batch

// --- Mongoose Schema and Model (Ensure it matches fetchData.js + new fields) ---
const SubjectSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true }, // Bangumi Subject ID
    type: Number,
    name: String,
    name_cn: String,
    summary: String,
    date: String, // Release date
    images: {
      large: String,
      common: String,
      medium: String,
      small: String,
      grid: String,
    },
    eps: Number,
    volumes: Number,
    collection: mongoose.Schema.Types.Mixed, // Simplified for this script
    rating: mongoose.Schema.Types.Mixed, // Simplified for this script
    tags: [{ name: String, count: Number }],
    locations: mongoose.Schema.Types.Mixed,
    // --- New fields for TMDB enrichment ---
    name_en: { type: String }, // English name from TMDB
    overview: { type: String }, // Overview/Synopsis from TMDB
    tmdb_enriched: { type: Boolean, default: false, index: true }, // Flag
  },
  { timestamps: true }
);

const Subject = mongoose.model("Subject", SubjectSchema);

// --- Helper Functions ---

/**
 * Adds a delay.
 * @param {number} ms - Milliseconds to wait.
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Searches TMDB for a movie based on a query string.
 * @param {string} query - The movie title to search for.
 * @returns {Promise<Array<object>>} - An array of TMDB search results, or empty array.
 */
async function searchTMDB(query) {
  if (!TMDB_API_BEARER_TOKEN) {
    console.error("TMDB_API_BEARER_TOKEN not found in .env");
    return [];
  }
  try {
    const response = await axios.get(TMDB_SEARCH_URL, {
      params: {
        query: query,
        include_adult: false,
        language: "en-US",
        page: 1,
      },
      headers: {
        Authorization: `Bearer ${TMDB_API_BEARER_TOKEN}`,
        accept: "application/json",
        "User-Agent": "Cascade/enrichScript (uoa-project)", // Optional: Be nice to APIs
      },
    });

    if (
      response.data &&
      response.data.results &&
      response.data.results.length > 0
    ) {
      // Return all results
      return response.data.results;
    } else {
      console.log(`No TMDB results found for query: "${query}"`);
      return []; // Return empty array if no results
    }
  } catch (error) {
    console.error(
      `Error searching TMDB for "${query}":`,
      error.response
        ? `${error.response.status} - ${error.response.statusText}`
        : error.message
    );
    // Handle specific rate limit error (429 Too Many Requests)
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.headers["retry-after"]; // seconds
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 + 500 : 5000; // wait specified time + buffer, or default 5s
      console.warn(
        `Rate limit hit. Waiting ${waitMs / 1000} seconds before retrying...`
      );
      await delay(waitMs);
      return searchTMDB(query); // Retry the request
    }
    return []; // For other errors, return empty array to signify failure/no results
  }
}

/**
 * Updates a subject in MongoDB with TMDB data or marks it as attempted.
 * @param {string} subjectMongoId - The MongoDB _id of the subject.
 * @param {object|null} tmdbData - The TMDB data object, or null if no data/error.
 */
async function updateSubjectInMongo(subjectMongoId, tmdbData) {
  let updateData = {};
  if (tmdbData) {
    // Ensure we have the necessary fields before trying to use them
    const title = tmdbData.title || tmdbData.name; // TMDB sometimes uses 'name' for TV
    const overview = tmdbData.overview;

    updateData = {
      name_en: title,
      overview: overview,
      tmdb_enriched: true,
    };
  } else {
    // Mark as attempted even if no data found or error occurred
    updateData = {
      tmdb_enriched: true,
    };
  }

  try {
    await Subject.findByIdAndUpdate(subjectMongoId, { $set: updateData });
    // console.log(`Updated subject ${subjectMongoId} successfully.`);
  } catch (error) {
    console.error(
      `Failed to update subject ${subjectMongoId} in MongoDB:`,
      error
    );
  }
}

// --- Main Execution Logic ---
async function main() {
  console.log("--- Starting TMDB Enrichment Script (Optimized) ---");
  const startTime = Date.now();
  let connectionEstablished = false;
  let sourceSubjectsProcessed = 0;
  let subjectsUpdated = 0;
  let apiCallsMade = 0;

  if (!MONGODB_URI || !TMDB_API_BEARER_TOKEN) {
    console.error(
      "MONGODB_URI or TMDB_API_BEARER_TOKEN is not defined in environment variables. Aborting."
    );
    return;
  }

  try {
    // 1. Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    connectionEstablished = true;
    console.log("MongoDB connected successfully.");

    // 2. Process subjects in batches
    let sourceSubjectsBatch = [];
    do {
      // Find a batch of subjects to use as search queries for TMDB
      sourceSubjectsBatch = await Subject.find({
        tmdb_enriched: { $ne: true },
        name: { $exists: true, $ne: null, $ne: "" }, // Ensure name exists for query
      })
        .limit(BATCH_SIZE)
        .select("_id name") // Select only needed fields
        .lean(); // Use lean for performance

      if (sourceSubjectsBatch.length === 0) {
        console.log("No more source subjects found to query TMDB.");
        break;
      }

      console.log(
        `Processing batch of ${sourceSubjectsBatch.length} source subjects...`
      );

      for (const sourceSubject of sourceSubjectsBatch) {
        console.log(
          `\nProcessing source subject: \"${sourceSubject.name}\" (ID: ${sourceSubject._id})`
        );
        let sourceSubjectWasUpdated = false; // Flag to track update status

        // Search TMDB using the source subject's name
        const tmdbResults = await searchTMDB(sourceSubject.name);
        apiCallsMade++;
        sourceSubjectsProcessed++; // Count the attempt here

        if (tmdbResults.length > 0) {
          console.log(
            ` -> Found ${tmdbResults.length} TMDB result(s) for \"${sourceSubject.name}\".`
          );

          // Now, try to match each TMDB result back to subjects in MongoDB
          for (const tmdbResult of tmdbResults) {
            // TMDB can return results for Movies and TV shows. Check both 'title' and 'name'.
            const tmdbTitle = tmdbResult.title || tmdbResult.name;
            const tmdbOriginalTitle =
              tmdbResult.original_title || tmdbResult.original_name;

            if (!tmdbOriginalTitle || !tmdbTitle) {
              console.log(
                `  -> Skipping TMDB result due to missing original_title/original_name or title/name.`
              );
              continue;
            }

            console.log(
              `  -> Checking TMDB result: \"${tmdbTitle}\" (Original: \"${tmdbOriginalTitle}\")`
            );

            try {
              // Find a subject in MongoDB matching the TMDB original_title,
              // ensuring it hasn't already been enriched (important!)
              // Using original_title for matching as it's often less localized
              const targetSubject = await Subject.findOne({
                name: tmdbOriginalTitle,
                tmdb_enriched: { $ne: true }, // Only update if not already done
              }).select("_id name"); // Select needed fields, not lean needed for update

              if (targetSubject) {
                console.log(
                  `    -> Found matching MongoDB subject: \"${targetSubject.name}\" (ID: ${targetSubject._id}). Updating...`
                );
                // Update the target subject with TMDB data
                await updateSubjectInMongo(targetSubject._id, tmdbResult); // Use the helper
                subjectsUpdated++;

                // Check if the updated subject was our source subject
                if (targetSubject._id.equals(sourceSubject._id)) {
                  sourceSubjectWasUpdated = true;
                }

                console.log(
                  `    -> Successfully updated subject ${targetSubject._id}.`
                );
              } else {
                console.log(
                  `    -> No matching, unenriched MongoDB subject found for \"${tmdbOriginalTitle}\".`
                );
              }
            } catch (dbError) {
              console.error(
                `    -> Error finding/updating subject for TMDB original title \"${tmdbOriginalTitle}\":`,
                dbError
              );
            }
          }
        } else {
          console.log(
            ` -> No TMDB results found for \"${sourceSubject.name}\".`
          );
        }

        // After checking all results, if the source subject itself wasn't updated,
        // mark it as processed now to prevent future API calls.
        if (!sourceSubjectWasUpdated) {
          try {
            // Double-check it's not enriched before marking
            const currentStatus = await Subject.findById(sourceSubject._id)
              .select("tmdb_enriched")
              .lean();
            if (currentStatus && !currentStatus.tmdb_enriched) {
              console.log(
                `   -> Marking source subject ${sourceSubject._id} as processed (no update occurred).`
              );
              await Subject.updateOne(
                { _id: sourceSubject._id },
                { $set: { tmdb_enriched: true } }
              );
            }
          } catch (finalUpdateError) {
            console.error(
              `   -> Failed to mark source subject ${sourceSubject._id} as processed after checking:`,
              finalUpdateError
            );
          }
        }

        // Respect TMDB rate limit after each API call
        console.log(
          `--- Waiting ${RATE_LIMIT_DELAY_MS}ms before next API call ---`
        );
        await delay(RATE_LIMIT_DELAY_MS); // This now correctly adds delay between API calls
      } // End of source subject loop

      console.log(
        `\nBatch finished. Total source subjects processed so far: ${sourceSubjectsProcessed}. Total updates made: ${subjectsUpdated}.`
      );
    } while (sourceSubjectsBatch.length > 0);

    console.log(
      `\nFinished processing. Total source subjects checked: ${sourceSubjectsProcessed}, Total TMDB API calls: ${apiCallsMade}, Total subjects updated with TMDB data: ${subjectsUpdated}`
    );
  } catch (error) {
    console.error("Script execution failed:", error.message, error.stack);
  } finally {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2); // Note: Removed unnecessary quotes
    console.log(`--- Script finished in ${duration} seconds ---`);
    // Ensure MongoDB connection is closed
    if (connectionEstablished && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }
  }
}

// Run the main function
main();
