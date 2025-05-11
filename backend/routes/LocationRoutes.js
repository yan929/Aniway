// routes/LocationRoutes.js
import express from "express";
import {
  addLocation,
  deleteLocation,
  getAllLocations,
  partialUpdateLocation,
  updateLocation,
  getCitiesByCountry, // Import the new controller function
  getLocationByAnime,
} from "../controllers/LocationController.js";

const router = express.Router();

router.get("/", getAllLocations);
router.get("/searchByAnime", getLocationByAnime);
router.post("/", addLocation);
router.put("/:id", updateLocation);
router.patch("/:id", partialUpdateLocation);
router.delete("/:id", deleteLocation);

// New route to get distinct cities by country
router.get("/cities/:country", getCitiesByCountry);

export default router;
