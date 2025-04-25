import express from "express";
import { fetchPlaceInfo, fetchPlacePhoto, } from "../controllers/GmapController.js";
import { fetchPlacePhotoByPlaceId, getPlaceDetails } from "../controllers/GMapDetailsFetchByPlaceId.js";

const router = express.Router();

router.post("/", fetchPlaceInfo);
router.post("/photo", fetchPlacePhoto);

//fethch place photo by place_id
router.get('/photo', fetchPlacePhotoByPlaceId);


//get place details by place_id
router.get("/:placeId", getPlaceDetails);
//Test Place ID： ChIJCewJkL2LGGAR3Qmk0vCTGkg

export default router;
