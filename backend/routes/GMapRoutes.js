const express = require('express');
const router = express.Router();
const { fetchPlaceInfo, fetchPlacePhoto } = require('../controllers/GmapController');

router.post('/', fetchPlaceInfo);
router.post('/photo', fetchPlacePhoto);
module.exports = router;