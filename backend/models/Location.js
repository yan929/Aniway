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
    anime_names: [String],
    anime_cn_names: [String],
    anime_en_names: [String],
    images: [String],
    searchRanking: { type: Number, default: 0, index: true },
    country: { type: String, index: true },
    city: { type: String, index: true },
    isValid: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    collection: "locations",
    strict: false,
  }
);

// Add a compound index for the coordinate lookup, as lat/lng were used for upserting
locationSchema.index({ lat: 1, lng: 1 });

export default mongoose.model("Location", locationSchema);
