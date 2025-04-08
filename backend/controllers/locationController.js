// controllers/locationController.js
const Location = require('../models/Location');

const getAllLocations = async (req, res) => {
  const locations = await Location.find();
  res.json(locations);
};

const addLocation = async (req, res) => {
  const { animeTitle, realLocation, coordinates, imageUrl, description } = req.body;
  const location = new Location({ animeTitle, realLocation, coordinates, imageUrl, description });
  const saved = await location.save();
  res.status(201).json(saved);
};

const updateLocation = async (req, res) => {
  try {
    const updated = await Location.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, overwrite: true } // replace the entire document
    );
    if (!updated) return res.status(404).json({ message: 'Location not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
};

const partialUpdateLocation = async (req, res) => {
  try {
    const updated = await Location.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true } // keep the existing fields and only update the specified ones
    );
    if (!updated) return res.status(404).json({ message: 'Location not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Partial update failed' });
  }
};

const deleteLocation = async (req, res) => {
  const { id } = req.params;
  const location = await Location.findByIdAndDelete(id);
  if (!location) {
    return res.status(404).json({ message: 'Location not found' });
  }
  res.json({ message: 'Location deleted' });
}


module.exports = { getAllLocations, addLocation,updateLocation, partialUpdateLocation,deleteLocation };