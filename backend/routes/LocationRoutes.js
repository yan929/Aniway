// routes/LocationRoutes.js
import express from "express";
import {
  addLocation,
  deleteLocation,
  getAllLocations,
  partialUpdateLocation,
  updateLocation,
} from "../controllers/LocationController.js";

const router = express.Router();

router.get("/", getAllLocations);
router.post("/", addLocation);
router.put("/:id", updateLocation);
router.patch("/:id", partialUpdateLocation);
router.delete("/:id", deleteLocation);

export default router;
