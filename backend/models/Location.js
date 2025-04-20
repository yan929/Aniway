// models/Location.js
const mongoose = require("mongoose");

// Merged schema using fields from the processed data (formerly AnimeLocation)
// and using a standard MongoDB ObjectId for _id.
const locationSchema = new mongoose.Schema(
  {
    // Fields from AnimeLocation schema
    name: { type: String, index: true },
    name_cn: { type: String, index: true },
    lat_precise: { type: Number, required: true },
    lng_precise: { type: Number, required: true },
    lat_rounded: { type: Number, required: true, index: true }, // Index for coordinate lookup
    lng_rounded: { type: Number, required: true, index: true }, // Index for coordinate lookup
    gmap_formatted_addresses: [String],
    search_ranking: { type: Number, default: 0, index: true },
    // Optional fields from AnimeLocation you might want to keep:
    // original_location_ids: [String],
    // gmap_raw_response: mongoose.Schema.Types.Mixed,

    // We are removing the old fields: animeTitle, realLocation, coordinates, imageUrl, description
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "locations", // Ensure it still points to the 'locations' collection
    // We are removing '_id: false' to use default Mongoose ObjectId
  }
);

// Add a compound index for the coordinate lookup if desired, might be more efficient
// locationSchema.index({ lat_rounded: 1, lng_rounded: 1 });

module.exports = mongoose.model("Location", locationSchema);
