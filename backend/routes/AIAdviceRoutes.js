// backend/routes/ChatgptRoutes.js
import express from "express";
import { analyzeUserInput } from "../controllers/AIControllers.js";

const router = express.Router();


router.post("/advice", analyzeUserInput);

export default router;
