// backend/routes/homeRoutes.js
const express = require("express");
const router = express.Router();
const { getTrendingData } = require("../controllers/homeController");

// Route for fetching trending data
router.get("/trending", getTrendingData);
// Future routes for the 'home' section could be added here

module.exports = router;
