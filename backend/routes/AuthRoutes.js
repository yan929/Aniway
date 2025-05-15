import express from "express";
import passport from "passport";
import {
  handleGoogleCallback,
  logoutUser,
  deleteUserAccount,
} from "../controllers/AuthController.js";

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: `${FRONTEND_URL}/login` }),
  handleGoogleCallback
);

router.get("/api/logout", logoutUser);

router.post("/api/user/delete", deleteUserAccount);

export default router;
