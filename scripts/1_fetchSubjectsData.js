require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");

// --- Configuration ---
const BGM_API_ENDPOINT = process.env.BGM_API_ENDPOINT;
const ANITABI_API_TEMPLATE = process.env.ANITABI_API_ENDPOINT_TEMPLATE;
const MONGODB_URI = process.env.MONGODB_URI;
const PAGE_LIMIT = 30; // Number of items per page for bgm.tv API

// --- Mongoose Schema and Model ---
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
    eps: Number, // Number of episodes
    volumes: Number, // Number of volumes (for books)
    rating: {
      rank: Number,
      total: Number,
      count: { type: Map, of: Number }, // Rating distribution
      score: Number,
    },
    // Added field for locations
    locations: { type: mongoose.Schema.Types.Mixed }, // Store the raw response from Anitabi for flexibility
  },
  { timestamps: true }
); // Add timestamps for creation and update

const Subject = mongoose.model("Subject", SubjectSchema);

// --- Helper Functions ---

/**
 * Fetches a single page of subject data from bgm.tv API.
 * @param {number} offset - The offset for the API call.
 * @param {number} limit - The number of items per page.
 * @returns {Promise<{subjects: Array, total: number}>} - An object containing the subjects for the page and the total count.
 */
async function fetchSubjectPage(offset, limit) {
  try {
    const params = {
      type: 2, // Type 2 for Anime
      sort: "rank",
      limit: limit,
      offset: offset,
    };
    console.log(`Fetching page with offset: ${offset}, limit: ${limit}...`);
    const response = await axios.get(BGM_API_ENDPOINT, {
      params,
      headers: { "User-Agent": "Cascade/fetchScript (uoa-project)" },
    });

    if (response.data) {
      return {
        subjects: response.data.data || [], // Return empty array if no data field
        total: response.data.total || 0, // Return 0 if no total field
      };
    } else {
      console.warn(`No response data found for offset ${offset}.`);
      return { subjects: [], total: 0 };
    }
  } catch (error) {
    console.error(
      `Error fetching page at offset ${offset}:`,
      error.response ? error.response.status : error.message
    );
    throw error;
  }
}

/**
 * Fetches location details for a given subject ID from anitabi.cn API.
 */
async function fetchLocations(subjectId) {
  if (!ANITABI_API_TEMPLATE) {
    console.warn(
      "Anitabi API template not configured. Skipping location fetching."
    );
    return null;
  }
  const url = ANITABI_API_TEMPLATE.replace("{id}", subjectId);
  try {
    // console.log(`Fetching locations for subject ID: ${subjectId} from ${url}`);
    const response = await axios.get(url, {
      headers: { "User-Agent": "Cascade/fetchScript (uoa-project)" },
    });
    // console.log(`Successfully fetched locations for subject ID: ${subjectId}`);
    return response.data; // Return the raw location data
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // console.log(`No location data found (404) for subject ID: ${subjectId}`);
      return null; // Handle 404 gracefully (no locations for this subject)
    } else {
      console.error(
        `Error fetching locations for subject ID ${subjectId}:`,
        error.response ? error.response.status : error.message
      );
      return null; // Return null on other errors to avoid stopping the whole process
    }
  }
}

/**
 * Processes a batch of subjects (fetches locations) and stores/updates them in MongoDB.
 * Assumes MongoDB connection is already established.
 * @param {Array} subjects - The batch of subjects to process.
 */
async function processAndStoreSubjects(subjects) {
  if (!subjects || subjects.length === 0) {
    console.log("No subjects provided to store.");
    return;
  }

  try {
    console.log(
      `Processing batch of ${subjects.length} subjects for location fetching and storage...`
    );
    let processedCount = 0;
    const bulkOps = [];

    for (const subject of subjects) {
      // Fetch locations for the current subject
      const locations = await fetchLocations(subject.id);
      // Add locations to the subject object (even if null)
      subject.locations = locations;

      // Prepare bulk operation for upsert
      bulkOps.push({
        updateOne: {
          filter: { id: subject.id }, // Use the unique Bangumi subject ID
          update: { $set: subject }, // Update the document with new data
          upsert: true, // Insert if document doesn't exist, update if it does
        },
      });

      processedCount++;
      if (processedCount % 50 === 0 || processedCount === subjects.length) {
        // Log progress
        console.log(
          `Processed ${processedCount}/${subjects.length} subjects...`
        );
      }

      // Optional delay between Anitabi API calls
      await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
    }

    // Execute bulk operations
    if (bulkOps.length > 0) {
      console.log(
        `Executing bulk write operation for ${bulkOps.length} subjects...`
      );
      const result = await Subject.bulkWrite(bulkOps);
      console.log("Bulk write completed.", {
        inserted: result.insertedCount,
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
      });
    } else {
      console.log("No operations to perform.");
    }
  } catch (error) {
    console.error("Error during MongoDB operation:", error);
    // Let the main function handle connection closing
  }
}

// --- Main Execution Logic ---
async function main() {
  console.log("--- Starting Page-by-Page Data Fetch and Store Script ---");
  const startTime = Date.now();
  let offset = 3420;
  let total = 0; // Initialize total, will be set by the first API response
  let fetchedCount = 0;
  let connectionEstablished = false;

  if (!MONGODB_URI) {
    console.error(
      "MONGODB_URI is not defined in environment variables. Aborting."
    );
    return;
  }

  try {
    // 1. Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    connectionEstablished = true;
    console.log("MongoDB connected successfully.");

    // 2. Loop through pages
    let initialFetch = true; // Flag for the first fetch to get total
    do {
      // Fetch a page of subjects
      let subjectsOnPage = [];
      let currentPageTotal = 0;

      try {
        const pageData = await fetchSubjectPage(offset, PAGE_LIMIT);
        subjectsOnPage = pageData.subjects;
        currentPageTotal = pageData.total;

        if (initialFetch) {
          total = currentPageTotal; // Set the total based on the first fetch
          console.log(`Total subjects reported by API: ${total}`);
          initialFetch = false; // No longer the initial fetch
        } else if (currentPageTotal !== total) {
          // Optional: Warn if total changes between pages, might indicate API inconsistency
          console.warn(
            `API total changed from ${total} to ${currentPageTotal} at offset ${offset}. Using original total.`
          );
        }
      } catch (error) {
        console.error(
          `Failed to fetch page at offset ${offset}. Stopping loop.`
        );
        break; // Stop if a page fetch fails critically
      }

      if (subjectsOnPage.length > 0) {
        fetchedCount += subjectsOnPage.length;
        console.log(
          `Fetched ${subjectsOnPage.length} subjects. Offset: ${offset}. Total fetched so far: ${fetchedCount}/${total}`
        );

        // Process and store this page's subjects
        await processAndStoreSubjects(subjectsOnPage);

        // Update offset for the next iteration
        offset += PAGE_LIMIT;

        // Optional delay between page fetches
        // await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        // If the page is empty BUT we haven't reached the total offset yet
        if (offset < total) {
          console.warn(
            `Received empty page at offset ${offset}, but total is ${total}. Incrementing offset by 1 and retrying.`
          );
          offset += 1; // Increment offset by 1 to check the next item index
        } else {
          // If offset >= total and we get an empty page, we are truly done
          console.log(
            `No more subjects found at offset ${offset} (total: ${total}). Finishing.`
          );
          break; // Exit loop
        }
      }
      // Continue loop as long as the current offset is less than the total expected
    } while (offset < total);

    console.log(
      `Finished processing all pages. Total subjects fetched: ${fetchedCount}`
    );
  } catch (error) {
    console.error("Script execution failed:", error.message);
  } finally {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`--- Script finished in ${duration} seconds ---`);
    // Ensure MongoDB connection is closed if it was established
    if (connectionEstablished && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }
  }
}

// Run the main function
main();
