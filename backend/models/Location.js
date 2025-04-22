// models/Location.js
const mongoose = require("mongoose");

// Schema based on the user-provided definite structure for the 'locations' collection
const locationSchema = new mongoose.Schema(
  {
    // _id is handled by Mongoose
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    addresses: [String],
    originIds: [String],
    anitabi_names: [String],
    anitabi_cn_names: [String],
    images: [String],
    searchRanking: { type: Number, default: 0, index: true },
  },
  {
    timestamps: true,
    collection: "locations",
  }
);

// Add a compound index for the coordinate lookup, as lat/lng were used for upserting
locationSchema.index({ lat: 1, lng: 1 });

module.exports = mongoose.model("Location", locationSchema);
