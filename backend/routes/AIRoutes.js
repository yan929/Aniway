import express from "express";
import {
  analyzeUserInput,
  itinerary,
  argumentItinerary,
} from "../controllers/AIControllers.js";

const router = express.Router();

router.post("/advice", analyzeUserInput);
router.post("/itinerary", itinerary);
router.post("/augment-itinerary", argumentItinerary);

export default router;
