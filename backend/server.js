// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "./models/User.js";

// Location Routes
import locationRoutes from "./routes/LocationRoutes.js";
// Home Routes (Trending)
import homeRoutes from "./routes/HomeRoutes.js";
// GMap Routes
import gmapRoutes from "./routes/GMapRoutes.js";
// Anime Routes
import animeRoutes from "./routes/AnimeRoutes.js";
// OpenAI API
import chatgptRoutes from "./routes/ChatgptRoutes.js";
// Trip Plan Routes
import tPlanRoutes from "./routes/TPlanRoutes.js";
// Error handling middleware
import { errorHandler } from "./middleware/ErrorMiddleware.js";
// AuthRoute
import authRoutes from "./routes/AuthRoutes.js";
// User Routes
import userRoutes from "./routes/UserRoutes.js";

import AIAdviceRoutes from "./routes/AIAdviceRoutes.js";

import TripDataRoutes from "./routes/TripDataRoutes.js";

dotenv.config();
connectDB();

const app = express();

// Trust proxy headers (e.g., X-Forwarded-Proto) to correctly determine protocol
// This is important for services like Render where the app is behind a reverse proxy
app.set("trust proxy", 1);

// Determine allowed origin based on environment
const allowedOrigin =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

app.use(express.json());

app.use(errorHandler);

// === Session Setup ===
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Enable secure in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    },
  })
);

// === OAuth Setup ===
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find or create user in the database
        let user = await User.findOne({ google_id: profile.id });

        if (!user) {
          user = new User({
            google_id: profile.id,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value || "",
            email: profile.emails?.[0]?.value || "",
          });
          await user.save();
        }

        // Return user data to passport
        return done(null, {
          id: profile.id,
          displayName: profile.displayName,
          photos: profile.photos,
          emails: profile.emails,
        });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// API Routes
app.use("/api/locations", locationRoutes);

app.use("/api/home", homeRoutes);

app.use("/api/gmap", gmapRoutes);

app.use("/api/anime", animeRoutes);

app.use("/api/chatgpt", chatgptRoutes);

app.use("/api/ai", AIAdviceRoutes);

app.use("/api/trip", TripDataRoutes);

app.use("/api/tplan", tPlanRoutes);

app.use("/api/user", userRoutes); // Mount user routes

app.use(authRoutes);

// Root
app.get("/", (req, res) => {
  res.send("AniWay backend is running 🚀");
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
