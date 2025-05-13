// routes/UserRoutes.js
import express from "express";
import {
  getUserProfile,
  getUserTrips,
  modifyUserProfile,
} from "../controllers/UserController.js";

const router = express.Router();

// Get user profile (includes basic trips info)
router.get("/profile", getUserProfile);

// Update user profile
router.patch("/profile", modifyUserProfile);

// Get user's trips with pagination and filtering
router.get("/trips", getUserTrips);

export default router;
