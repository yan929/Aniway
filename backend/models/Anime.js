// backend/models/Anime.js
const mongoose = require("mongoose");

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
    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }], // Array of refs to Location documents
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

module.exports = mongoose.model("Anime", animeSchema);
