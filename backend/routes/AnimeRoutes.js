// backend/routes/AnimeRoutes.js
import express from "express";
import { searchAnimeByLocation } from "../controllers/AnimeController.js";

const router = express.Router();

// Route for searching anime by location keyword
// Example: GET /api/anime/by_location_keyword?q=Tokyo
router.get("/by_location_keyword", searchAnimeByLocation);

// Future routes for anime could be added here

export default router;
