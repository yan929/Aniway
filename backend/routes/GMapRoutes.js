import express from "express";
import {
  fetchPlaceInfo,
  fetchPlacePhoto,
  fetchPlaceNearby,
  getPlaceDetails,
} from "../controllers/GmapController.js";

const router = express.Router();

router.post("/place_by_latlng", fetchPlaceInfo);
router.get("/place_by_id/:placeId", getPlaceDetails);
router.get("/place_by_nearby", fetchPlaceNearby);
router.post("/photo", fetchPlacePhoto);

export default router;
