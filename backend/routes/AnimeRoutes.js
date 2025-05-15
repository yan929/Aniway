import express from "express";
import {
  searchAnimeByLocation,
  getAnimeInfoById,
  getAnimeLocation,
  getAnimeIdByName,
} from "../controllers/AnimeController.js";

const router = express.Router();

router.get("/by_location_keyword", searchAnimeByLocation);
router.get("/info/:anime_id", getAnimeInfoById);
router.get("/:anime_name", getAnimeIdByName);
router.get("/locations/:anime_name", getAnimeLocation);
export default router;
