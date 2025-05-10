import express from "express";
import passport from "passport";

const router = express.Router();

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("http://localhost:5173/login");
  }
);

router.get("/api/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

router.post("/api/user/delete", async (req, res) => {
  console.log("Test req.isAuth: ", req.isAuthenticated());

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user;
  const accessToken = user?.accessToken;

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

    req.logout((err) => {
      if (err) return res.status(500).send("Logout failed");
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.redirect("http://localhost:5173/login");
      });
    });
  } catch (error) {
    console.log("Error with revoking process: ", error.message);
  }
});

router.get("/api/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send("Logout failed");
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect("http://localhost:5173/login");
    });
  });
});

export default router;
