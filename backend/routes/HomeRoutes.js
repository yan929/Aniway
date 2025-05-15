import express from "express";
import {
  getTrendingData,
  searchData,
  searchAllLocations,
  searchCitiesAndCountries,
} from "../controllers/HomeController.js";

const router = express.Router();

router.get("/trending", getTrendingData);
router.get("/search", searchData);
router.get("/search/all", searchAllLocations);
router.get("/search/cities-countries", searchCitiesAndCountries);

export default router;
