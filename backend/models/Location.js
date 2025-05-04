// models/Location.js
import mongoose from "mongoose";

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
    anime_names: [String], // Use plural name
    anime_cn_names: [String], // Use plural name
    anime_en_names: [String], // Use plural name
    images: [String],
    searchRanking: { type: Number, default: 0, index: true },
    country: { type: String, index: true },
    city: { type: String, index: true },
    gmap_raw_response: { type: Object },
    gmap_nearby_response: { type: mongoose.Schema.Types.Mixed }, // Raw response from nearby search
    isValid: { type: Boolean, default: false, index: true }, // Validity based on nearby search
    nearby: [
      {
        _id: false,
        place_id: String,
        name: String,
        lat: Number,
        lng: Number,
        rating: Number,
        user_ratings_total: Number,
        types: [String],
        vicinity: String,
      },
    ],
  },
  {
    timestamps: true,
    collection: "locations", // Explicitly targeting the 'locations' collection
    strict: false, // Allow fields not explicitly defined in the schema
  }
);

// Add a compound index for the coordinate lookup, as lat/lng were used for upserting
locationSchema.index({ lat: 1, lng: 1 });

export default mongoose.model("Location", locationSchema);
