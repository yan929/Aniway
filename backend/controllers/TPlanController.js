import asyncHandler from "express-async-handler";
import TripPlan from "../models/TripPlan.js";

const getAllPlans = asyncHandler(async (req, res) => {
  try {
    const tripPlanData = await TripPlan.find()
      .sort({ search_ranking: -1 })
      .select("title content user_id");

    const tripPlans = tripPlanData.map((plan) => ({
        title: plan.title,
        
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
    

  } catch (error) {
    console.error("Error posting trip plan:", error);
    res.status(500).json({ message: "Server error while posting a trip plan" });
  }
});

export default {
  getAllPlans,
  addPlan,
  //   deletePlan,
  //   getPlan,
  //   partialUpdatePlan,
};
