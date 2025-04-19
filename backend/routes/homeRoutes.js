// backend/routes/homeRoutes.js
const express = require("express");
const router = express.Router();
const {
  getTrendingData,
  searchData,
} = require("../controllers/homeController");

// Route for fetching trending data
router.get("/trending", getTrendingData);

// Route for searching anime and locations
router.get("/search", searchData);

// Future routes for the 'home' section could be added here

module.exports = router;
