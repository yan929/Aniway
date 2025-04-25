// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
// Location Routes
import locationRoutes from "./routes/LocationRoutes.js";
// Home Routes (Trending)
import homeRoutes from "./routes/HomeRoutes.js";
// GMap Routes
import gmapRoutes from "./routes/GMapRoutes.js";
// OpenAI API
import chatgptRoutes from "./routes/ChatgptRoutes.js";
// Error handling middleware
import { errorHandler } from "./middleware/ErrorMiddleware.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/locations", locationRoutes);

app.use("/api/home", homeRoutes);

app.use("/api/gmap", gmapRoutes);

app.use("/api/chatgpt", chatgptRoutes);

// Root
app.get("/", (req, res) => {
  res.send("AniWay backend is running 🚀");
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "::", () => console.log(`Server running on port ${PORT}`));
