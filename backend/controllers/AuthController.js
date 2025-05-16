import axios from "axios";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export const handleGoogleCallback = (req, res) => {
  // req.user is populated by Passport's deserializeUser
  const userId = req.user?.id || ""; // Use optional chaining for safety
  res.redirect(`${FRONTEND_URL}/profile/${userId}`);
};

export const logoutUser = (req, res, next) => {
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
      res.clearCookie("connect.sid"); // Ensure this is the correct session cookie name
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
};

export const deleteUserAccount = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user; // Assuming this user object has id and accessToken
  const accessToken = user?.accessToken;

  if (!user || !user.id) {
    // This case should ideally not happen if ensureAuthenticated is working
    return res.status(400).json({ message: "User information is missing." });
  }

  if (!accessToken) {
    console.warn(
      `[AuthController] Access token not found for user ${user.id} during account deletion. Skipping Google token revocation.`
    );
    // Decide if you want to proceed with DB deletion even if token cannot be revoked.
    // For now, we'll proceed with DB deletion and logout.
  }

  try {
    if (accessToken) {
      try {
        const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${accessToken}`;
        await axios.post(revokeUrl, null, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
      } catch (revokeError) {
        console.error(
          `[AuthController] Error revoking Google token for user ${user.id}:`,
          revokeError.response ? revokeError.response.data : revokeError.message
        );
        // If Google returns a 400, it might mean the token is already invalid/revoked, which is okay.
        // We can still proceed to delete the user from our database.
        if (!(revokeError.response && revokeError.response.status === 400)) {
          // For other errors, you might want to halt or handle differently.
          // For now, we log and continue to local deletion.
        }
      }
    }

    // Delete user from your database
    await User.findOneAndDelete({ google_id: user.id });

    // Logout and destroy session
    req.logout((logoutErr) => {
      if (logoutErr) {
        console.error(
          `[AuthController] Logout error after deleting user ${user.id}:`,
          logoutErr
        );
        // Even if logout fails, session destruction should proceed.
        // The response indicating success/failure of deletion has higher priority.
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error(
            `[AuthController] Session destruction error after deleting user ${user.id}:`,
            destroyErr
          );
        }
        res.clearCookie("connect.sid"); // Ensure this is your session cookie name

        // Respond based on original request type (JSON or redirect)
        if (
          req.xhr ||
          (req.headers.accept && req.headers.accept.includes("json"))
        ) {
          res
            .status(200)
            .json({ message: "Account successfully deleted and logged out." });
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
    console.error(
      `[AuthController] General error during account deletion for user ${user.id}:`,
      error
    );
    res.status(500).json({
      message: "An error occurred during account deletion.",
      error: error.message,
    });
  }
};
