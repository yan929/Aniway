// backend/routes/HomeRoutes.js
import express from "express";
import {
  getTrendingData,
  searchData,
  searchAllLocations,
  searchCitiesAndCountries,
} from "../controllers/HomeController.js";

const router = express.Router();

// Route for fetching trending data
router.get("/trending", getTrendingData);

// Route for searching anime and locations
router.get("/search", searchData);

// Future routes for the 'home' section could be added here
// For searching all locations without limit
router.get("/search/all", searchAllLocations);

router.get("/search/cities-countries", searchCitiesAndCountries);

export default router;
