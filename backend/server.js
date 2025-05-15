// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import path from "path";
import connectDB from "./config/db.js";
import configureGoogleStrategy from "./config/passportSetup.js";
import { errorHandler } from "./middleware/ErrorMiddleware.js";
import configureRoutes from "./routes/routes.js";

dotenv.config();
connectDB();

const app = express();

// Trust proxy headers (e.g., X-Forwarded-Proto) to correctly determine protocol
// This is important for services like Render where the app is behind a reverse proxy
app.set("trust proxy", 1);
app.use(express.json());

// Determine allowed origin based on environment
const otherOrigins = process.env.OTHER_ORIGINS?.split(",") || [];
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL, ...otherOrigins]
    : ["http://localhost:5173", ...otherOrigins];
const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

app.use(
  cors({
    origin: uniqueAllowedOrigins,
    credentials: true,
  })
);

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

// Configure Passport strategies
configureGoogleStrategy(passport);

// API Routes
configureRoutes(app);

const __dirname = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.use((req, res) =>
    res.sendFile(path.resolve(__dirname, "../frontend/dist", "index.html"))
  );
}

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
