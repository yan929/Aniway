// backend/models/Anime.js
const mongoose = require("mongoose");

// Schema derived from the migration script 7_migrateSubjectsToAnime.js

// Define the structure within the locations array (renamed from locations_info)
const locationInfoSchema = new mongoose.Schema(
  {
    original_location_id: String,
    name: String,
    name_cn: String,
    lat_precise: Number,
    lng_precise: Number,
    standardized_location_id: String, // Links to Location _id
    lat_rounded: Number,
    lng_rounded: Number,
    gmap_formatted_addresses: [String],
  },
  { _id: false }
);

const animeSchema = new mongoose.Schema(
  {
    // _id: mongoose.Schema.Types.ObjectId, // Handled by Mongoose automatically
    bangumi_id: { type: Number, unique: true, index: true },
    date: String,
    name: { type: String, index: true },
    name_cn: { type: String, index: true },
    name_en: String,
    eps: Number,
    images: {
      large: String,
      common: String,
      medium: String,
      small: String,
      grid: String,
    },
    overview: String, // Added during TMDB enrichment potentially
    summary: String,
    locations: [locationInfoSchema],
    search_ranking: { type: Number, default: 0, index: true }, // Field for trending sort
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "anime", // Explicitly set collection name
  }
);

module.exports = mongoose.model("Anime", animeSchema);
