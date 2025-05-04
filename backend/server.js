// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

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
import authRoutes from './routes/AuthRoutes.js';

import AIAdviceRoutes from "./routes/AIAdviceRoutes.js";

import TripDataRoutes from "./routes/TripDataRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // your frontend origin
  credentials: true                // if you’re using cookies
}));

app.use(express.json());

app.use("/api/locations", locationRoutes);

app.use("/api/home", homeRoutes);

app.use("/api/gmap", gmapRoutes);

app.use("/api/anime", animeRoutes);

app.use("/api/chatgpt", chatgptRoutes);

app.use("/api/ai", AIAdviceRoutes);

app.use("/api/trip", TripDataRoutes);

app.use("/api/tplan", tPlanRoutes);

// Root
app.get("/", (req, res) => {
  res.send("AniWay backend is running 🚀");
});

app.use(errorHandler);

// === Session Setup ===
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// === OAuth Setup ===
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use(authRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, "::", () => console.log(`Server running on port ${PORT}`));
