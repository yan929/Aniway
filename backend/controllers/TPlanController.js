import asyncHandler from "express-async-handler";
import TripPlan from "../models/TripPlan.js";

const getAllPlans = asyncHandler(async (req, res) => {
  try {
    // Modify later (need to decide use middleware/ query)
    const userId = "1";

    const tripPlanData = await TripPlan.find({ user_id: userId })
      .sort({ search_ranking: -1 })
      .select("title content user_id");

    const tripPlans = tripPlanData.map((plan) => ({
      title: plan.title,
      content: plan.content,
    }));

    res.json({
      tripPlans,
    });
  } catch (error) {
    console.error("Error fetching trip plan:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching all trip plan" });
  }
});

const addPlan = asyncHandler(async (req, res) => {
  try {
    const data = req.body;

    const newPlan = new TripPlan(data);
    const savedPlan = await newPlan.save();

    res.status(201).json(savedPlan);
  } catch (error) {
    console.error("Error posting trip plan:", error);
    res.status(500).json({ message: "Server error while posting a trip plan" });
  }
});

export { getAllPlans, addPlan };
