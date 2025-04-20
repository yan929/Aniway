// routes/locationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getAllLocations, 
  addLocation, 
  updateLocation, 
  partialUpdateLocation, 
  deleteLocation 
} = require('../controllers/locationController');

router.get('/', getAllLocations);
router.post('/', addLocation);
router.put('/:id', updateLocation);
router.patch('/:id', partialUpdateLocation); 
router.delete('/:id', deleteLocation);

module.exports = router;
