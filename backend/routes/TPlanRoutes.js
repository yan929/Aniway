// routes/LocationRoutes.js
import express from "express";
import {
  getAllPlans,
  addPlan,
  getPlan,
  partialUpdatePlan,
  deletePlan,
} from "../controllers/TPlanController.js";

const router = express.Router();

router.get("/", getAllPlans);
router.post("/", addPlan);
router.get("/:id", getPlan);
router.patch("/:id", partialUpdatePlan);
router.delete("/:id", deletePlan);

export default router;
