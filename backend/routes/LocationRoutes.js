import express from "express";
import {
  deleteLocation,
  getAllLocations,
  partialUpdateLocation,
  updateLocation,
  getCitiesByCountry,
  getLocationByAnime,
  searchRelevantLocationsApi,
} from "../controllers/LocationController.js";

const router = express.Router();

router.get("/", getAllLocations);
router.get("/searchByAnime", getLocationByAnime);
router.put("/:id", updateLocation);
router.patch("/:id", partialUpdateLocation);
router.delete("/:id", deleteLocation);
router.get("/cities/:country", getCitiesByCountry);
router.get("/search-relevant", searchRelevantLocationsApi);

export default router;
