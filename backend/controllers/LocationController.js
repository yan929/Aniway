// controllers/LocationController.js
import asyncHandler from "express-async-handler";
import Location from "../models/Location.js";

const getAllLocations = asyncHandler(async (req, res) => {
  const locations = await Location.find();
  res.json(locations);
});

const addLocation = asyncHandler(async (req, res) => {
  const {
    name,
    name_cn,
    lat_precise,
    lng_precise /* other Location fields */,
  } = req.body;
  const location = new Location({
    name,
    name_cn,
    lat_precise,
    lng_precise /* ... */,
  });
  const saved = await location.save();
  res.status(201).json(saved);
});

const updateLocation = asyncHandler(async (req, res) => {
  try {
    const updated = await Location.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      overwrite: true,
    });
    if (!updated)
      return res.status(404).json({ message: "Location not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating location:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

const partialUpdateLocation = asyncHandler(async (req, res) => {
  try {
    const updated = await Location.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ message: "Location not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error partially updating location:", err);
    res.status(500).json({ error: "Partial update failed" });
  }
});

const deleteLocation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const location = await Location.findByIdAndDelete(id);
  if (!location) {
    return res.status(404).json({ message: "Location not found" });
  }
  res.json({ message: "Location deleted" });
});

export {
  getAllLocations,
  addLocation,
  updateLocation,
  partialUpdateLocation,
  deleteLocation,
};
