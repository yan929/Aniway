import express from "express";
import {
  fetchPlaceInfo,
  fetchPlacePhoto,
  fetchPlaceNearby,
} from "../controllers/GmapController.js";
import {
  fetchPlacePhotoByPlaceId,
  getPlaceDetails,
} from "../controllers/GMapDetailsFetchByPlaceId.js";

const router = express.Router();

router.post("/", fetchPlaceInfo);
// get place details by place_id
router.get("/:placeId", getPlaceDetails); // Test Place ID： ChIJCewJkL2LGGAR3Qmk0vCTGkg
router.get("/place_by_nearby", fetchPlaceNearby);
router.post("/photo", fetchPlacePhoto);
router.get("/photo", fetchPlacePhotoByPlaceId);

export default router;
