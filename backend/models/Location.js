// models/Location.js
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  animeTitle: { type: String, required: true },
  realLocation: { type: String, required: true },
  coordinates: {
    lat: Number,
    lng: Number
  },
  imageUrl: String,
  description: String
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);
// This code defines a Mongoose schema for an anime location model.