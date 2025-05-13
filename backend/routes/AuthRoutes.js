import express from "express";
import passport from "passport";
import axios from "axios";
import User from "../models/User.js";

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: `${FRONTEND_URL}/login` }),
  (req, res) => {
    const userId = req.user.id || req.user._id || "";
    res.redirect(`${FRONTEND_URL}/profile/${userId}`);
  }
);

router.get("/api/user", (req, res) => {
  if (req.isAuthenticated()) {
    // Return user information if authenticated
    res.json({
      id: req.user.id,
      name: req.user.displayName,
      avatar: req.user.photos?.[0]?.value || "",
      email: req.user.emails?.[0]?.value || "",
    });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

router.get("/api/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      if (
        req.xhr ||
        (req.headers.accept && req.headers.accept.includes("json"))
      ) {
        return res.status(500).json({ message: "Logout failed" });
      }
      return next(err);
    }
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        if (
          req.xhr ||
          (req.headers.accept && req.headers.accept.includes("json"))
        ) {
          return res
            .status(500)
            .json({ message: "Session destruction failed" });
        }
        return next(destroyErr);
      }
      res.clearCookie("connect.sid");
      if (
        req.xhr ||
        (req.headers.accept && req.headers.accept.includes("json"))
      ) {
        res.status(200).json({ message: "Logged out successfully" });
      } else {
        const logoutRedirectUrl =
          (process.env.NODE_ENV === "production"
            ? process.env.FRONTEND_URL
            : "http://localhost:5173") + "/login";
        res.redirect(logoutRedirectUrl);
      }
    });
  });
});

router.post("/api/user/delete", async (req, res) => {
  console.log("Test req.isAuth: ", req.isAuthenticated());
  console.log("Test req.user: ", req.user);

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user;
  const accessToken = user?.accessToken;

  console.log("Test req.token: ", accessToken);

  if (!accessToken) {
    return res.status(400).json({ message: "Access token is missing" });
  }

  try {
    const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${accessToken}`;

    await axios.post(revokeUrl, null, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    console.log(
      `Google token successfully revoked for user: ${
        user.id || user.displayName
      }`
    );

    await User.findOneAndDelete({ google_id: user.id });

    req.logout((err) => {
      if (err) {
        if (
          req.xhr ||
          (req.headers.accept && req.headers.accept.includes("json"))
        ) {
          return res.status(500).json({ message: "Logout failed" });
        }
        return next(err);
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          if (
            req.xhr ||
            (req.headers.accept && req.headers.accept.includes("json"))
          ) {
            return res
              .status(500)
              .json({ message: "Session destruction failed" });
          }
          return next(destroyErr);
        }
        res.clearCookie("connect.sid");
        if (
          req.xhr ||
          (req.headers.accept && req.headers.accept.includes("json"))
        ) {
          res.status(200).json({ message: "Logged out successfully" });
        } else {
          const logoutRedirectUrl =
            (process.env.NODE_ENV === "production"
              ? process.env.FRONTEND_URL
              : "http://localhost:5173") + "/login";
          res.redirect(logoutRedirectUrl);
        }
      });
    });
  } catch (error) {
    console.log("Error with revoking process: ", error.message);
  }
});

export default router;
