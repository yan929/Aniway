// backend/models/AnimeLocation.js
const mongoose = require("mongoose");

// Schema for the 'locations' collection created by the data processing scripts.
// Originally named 'standardized_locations'.
const animeLocationSchema = new mongoose.Schema(
  {
    // The _id is a string: 'lat_rounded,lng_rounded'
    _id: String,
    name: { type: String, index: true },
    name_cn: { type: String, index: true },
    lat_precise: { type: Number, required: true },
    lng_precise: { type: Number, required: true },
    lat_rounded: { type: Number, required: true },
    lng_rounded: { type: Number, required: true },
    original_location_ids: [String], // IDs from the original subjects.locations
    gmap_formatted_addresses: [String], // Enriched data from Google Maps
    gmap_raw_response: mongoose.Schema.Types.Mixed, // Store the raw API response
    search_ranking: { type: Number, default: 0, index: true }, // Field for trending sort
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "locations", // Explicitly target the 'locations' collection
    _id: false, // Prevent Mongoose from creating its own ObjectId _id
  }
);

module.exports = mongoose.model("AnimeLocation", animeLocationSchema);
