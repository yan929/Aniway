import locationRoutes from "./LocationRoutes.js";
import homeRoutes from "./HomeRoutes.js";
import gmapRoutes from "./GMapRoutes.js";
import animeRoutes from "./AnimeRoutes.js";
import tPlanRoutes from "./TripPlanRoutes.js";
import authRoutes from "./AuthRoutes.js";
import userRoutes from "./UserRoutes.js";
import AIRoutes from "./AIRoutes.js";
import { ensureAuthenticated } from "../middleware/Authenticate.js";

const configureRoutes = (app) => {
  app.use("/api/locations", locationRoutes);
  app.use("/api/home", homeRoutes);
  app.use("/api/gmap", gmapRoutes);
  app.use("/api/anime", animeRoutes);
  app.use("/api/ai", AIRoutes);
  app.use("/api/tplan", ensureAuthenticated, tPlanRoutes);
  app.use("/api/user", userRoutes);
  app.use(authRoutes);
};

export default configureRoutes;
