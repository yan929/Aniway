const express = require('express');
const router = express.Router();
const { fetchPlaceInfo, fetchPlacePhoto } = require('../controllers/GmapController');
const { getPlaceDetails,fetchPlacePhotoByPlaceId } = require('../controllers/GMapDetailsFetchByPlaceId');



router.post('/', fetchPlaceInfo);
router.post('/photo', fetchPlacePhoto);


//fethch place photo by place_id
router.get('/photo', fetchPlacePhotoByPlaceId);


//get place details by place_id
router.get('/:placeId', getPlaceDetails);
//Test Place ID： ChIJCewJkL2LGGAR3Qmk0vCTGkg


module.exports = router;