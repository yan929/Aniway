import express from 'express';
import { saveTripData, getTripsByUser } from '../controllers/TripController.js';

const router = express.Router();

router.post('/save', saveTripData);
router.get('/getbyuser', getTripsByUser);

export default router;