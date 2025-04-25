import express from "express";
const router = express.Router();
import {
  fetchPlaceInfo,
  fetchPlacePhoto,
} from "../controllers/GmapController.js";
import { getPlaceDetails,fetchPlacePhotoByPlaceId } from "../controllers/GMapDetailsFetchByPlaceId.js";

router.post("/", fetchPlaceInfo);
router.post("/photo", fetchPlacePhoto);

//fethch place photo by place_id
router.get('/photo', fetchPlacePhotoByPlaceId);


//get place details by place_id
router.get("/:placeId", getPlaceDetails);
//Test Place ID： ChIJCewJkL2LGGAR3Qmk0vCTGkg

export default router;
