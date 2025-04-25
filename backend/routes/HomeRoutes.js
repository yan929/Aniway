// backend/routes/HomeRoutes.js
import express from "express";
import {getTrendingData, searchData} from "../controllers/HomeController.js";

const router = express.Router();

// Route for fetching trending data
router.get("/trending", getTrendingData);

// Route for searching anime and locations
router.get("/search", searchData);

// Future routes for the 'home' section could be added here

export default router;
