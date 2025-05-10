import asyncHandler from "express-async-handler";
import TripPlan from "../models/TripPlan.js";

const getAllPlans = asyncHandler(async (req, res) => {
  try {
    // Modify later (need to decide use middleware/ query)
    const userId = "1";

    const tripPlansData = await TripPlan.find({ user_id: userId })
      .sort({ search_ranking: -1 })
      .select("title content user_id");

    const tripPlans = tripPlansData.map((plan) => ({
      id: plan.id,
      title: plan.title,
      content: plan.content,
    }));

    res.json(tripPlans);
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

const getPlan = asyncHandler(async (req, res) => {
  try {
    const tripPlanData = await TripPlan.findById(req.params.id);
    if (!tripPlanData) {
      return res.status(400).json({ message: "Trip plan not found" });
    }
    const tripPlan = {
      id: tripPlanData.id,
      title: tripPlanData.title,
      content: tripPlanData.content,
    };

    res.status(200).json(tripPlan);
  } catch (error) {
    console.error("Error posting trip plan:", error);
    res.status(500).json({ message: "Server error while posting a trip plan" });
  }
});

// Reference from the code of partialUpdateLocation in LocationController
const partialUpdatePlan = asyncHandler(async (req, res) => {
  try {
    const updatedPlan = await TripPlan.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedPlan)
      return res.status(404).json({ message: "Trip plan not found" });
    res.json(updatedPlan);
  } catch (err) {
    console.error("Error partially updating plan:", err);
    res.status(500).json({ error: "Partial update failed" });
  }
});

const deletePlan = asyncHandler(async (req, res) => {
  try {
    const deletePlan = await TripPlan.findByIdAndDelete(req.params.id);

    if (!deletePlan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.status(200).json({ message: "Delete successful" });
  } catch (error) {
    console.error("Error deleting plan:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export { getAllPlans, addPlan, getPlan, partialUpdatePlan, deletePlan };
