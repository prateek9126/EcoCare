import { Router } from 'express';
import { chargingController } from '../controllers/chargingController.js';

const router = Router();

router.get('/nearby', (req, res) => chargingController.getNearbyStations(req, res));

export default router;
