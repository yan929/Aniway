// backend/models/Anime.js
import mongoose from "mongoose";

// Define the schema for the embedded location document
const locationSubSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // Anitabi ID or similar unique identifier for the point in the anime
    cn: String, // Chinese name
    name: String, // Original name (e.g., Japanese)
    image: String, // URL for an image associated with this location point
    ep: Number, // Episode number where this location appears
    origin: String, // Source of the location data (e.g., 'Anitabi@concert')
    originURL: String, // URL related to the origin
    locationRef: { type: mongoose.Schema.Types.ObjectId, ref: "Location" }, // Reference to the main Location document in the 'locations' collection
    lat: Number,
    lng: Number,
    addresses: [String], // Array of address strings
    anitabi_names: [String], // Array of names from Anitabi
    anitabi_cn_names: [String], // Array of Chinese names from Anitabi
  },
  { _id: false }
); // Disable automatic _id generation for subdocuments

const animeSchema = new mongoose.Schema(
  {
    bangumi_id: { type: Number, unique: true, index: true },
    name: { type: String, index: true },
    name_cn: { type: String, index: true },
    name_en: String,
    category: String, // e.g., 'TV', 'Movie' (from TMDB)
    summary: String,
    overview: String, // From TMDB
    info: String, // Additional info text
    site: String, // Official website URL
    author: String,
    director: String,
    cover: String, // URL to a primary cover image?
    icon: String, // URL to an icon image?
    ep: Number, // Episode count
    city: String, // Main location
    fade: Number, // Ranking?
    images: {
      large: String,
      common: String,
      medium: String,
      small: String,
      grid: String,
    },
    locations: [locationSubSchema], // Array of embedded location subdocuments
    geo: [Number], // [lat, lng]
    searchRanking: { type: Number, default: 0, index: true },
    tmdbId: Number,
    tmdbVoteAverage: Number,
    tmdbVoteCount: Number,
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "anime", // Explicitly set collection name
  }
);

export default mongoose.model("Anime", animeSchema);
