import asyncHandler from "express-async-handler";
import TripPlan from "../models/TripPlan.js";

const getAllPlans = asyncHandler(async (req, res) => {
  try {
    // Use authenticated user's ID instead of hardcoded value
    const userId = req.user.id;

    const tripPlansData = await TripPlan.find({ userId: userId })
      .sort({ updatedAt: -1 })
      .select("title content userId image startDate endDate destination");

    const tripPlans = tripPlansData.map((plan) => ({
      id: plan.id,
      title: plan.title,
      content: plan.content,
      image: plan.image,
      startDate: plan.startDate,
      endDate: plan.endDate,
      destination: plan.destination,
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

    // If content exists and has elements, set startDate and endDate
    if (Array.isArray(data.content) && data.content.length > 0) {
      data.startDate = data.content[0].date;
      data.endDate = data.content[data.content.length - 1].date;
    }

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
    const tripPlanData = await TripPlan.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!tripPlanData) {
      return res
        .status(404)
        .json({ message: "Trip plan not found or not authorized" });
    }
    const tripPlan = {
      id: tripPlanData.id,
      title: tripPlanData.title,
      content: tripPlanData.content,
      image: tripPlanData.image,
      startDate: tripPlanData.startDate,
      endDate: tripPlanData.endDate,
      destination: tripPlanData.destination,
    };

    res.status(200).json(tripPlan);
  } catch (error) {
    console.error("Error fetching trip plan:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching a trip plan" });
  }
});

// Reference from the code of partialUpdateLocation in LocationController
const partialUpdatePlan = asyncHandler(async (req, res) => {
  console.log("patch, id:", req.params.id);
  console.log("patch, user:", req.user);
  try {
    const updatedPlan = await TripPlan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
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
    const deletePlan = await TripPlan.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deletePlan) {
      return res
        .status(404)
        .json({ message: "Plan not found or not authorized" });
    }

    res.status(200).json({ message: "Delete successful" });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({ error: "Delete failed" });
  }
});

export { getAllPlans, addPlan, getPlan, partialUpdatePlan, deletePlan };
