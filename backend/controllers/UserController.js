// controllers/UserController.js
import User from "../models/User.js";
import TripPlan from "../models/TripPlan.js";

// Get user profile with trips
export const getUserProfile = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find or create user in our database based on Google profile
    let user = await User.findOne({ google_id: req.user.id });

    if (!user) {
      // Create new user if not found
      user = new User({
        google_id: req.user.id,
        name: req.user.displayName || "User",
        avatar: req.user.photos?.[0]?.value || "",
        email: req.user.emails?.[0]?.value || "",
      });
      await user.save();
    }

    // Get user's trips sorted by most recently updated
    const trips = await TripPlan.find({ user_id: user.google_id }).sort({
      updatedAt: -1,
    });

    // Return user profile with trips
    res.json({
      id: user.google_id,
      name: user.name,
      avatar: user.avatar,
      email: user.email,
      trips: trips,
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user's trips
export const getUserTrips = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ google_id: req.user.id });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's trips with optional filtering
    const { status, limit = 10, skip = 0 } = req.query;

    const query = { user_id: user.google_id };
    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const trips = await TripPlan.find(query)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const totalTrips = await TripPlan.countDocuments(query);

    res.json({
      trips,
      pagination: {
        total: totalTrips,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: totalTrips > parseInt(skip) + parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error getting user trips:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const modifyUserProfile = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log("User profile update request:", req.body.name);

    const { name } = req.body;

    // Find user by Google ID
    const user = await User.findOne({ google_id: req.user.id });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user profile
    user.name = name || user.name;

    console.log("Updated user:", user);

    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
