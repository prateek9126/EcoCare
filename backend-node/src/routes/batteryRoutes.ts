import { Router } from 'express';
import { batteryController } from '../controllers/batteryController.js';

const router = Router();

router.post('/analyze', (req, res) => batteryController.analyzeBattery(req, res));
router.get('/vehicle/:vehicleId', (req, res) => batteryController.getVehicleHistory(req, res));
router.get('/:batteryId/history', (req, res) => batteryController.getBatteryHistory(req, res));
router.get('/history', (req, res) => batteryController.getAnalysisHistory(req, res));
router.get('/vehicles', (req, res) => batteryController.getVehicles(req, res));
router.get('/public/assessment/:id', (req, res) => batteryController.getPublicAssessment(req, res));
router.delete('/history', (req, res) => batteryController.clearHistory(req, res));
router.post('/complaint', (req, res) => batteryController.raiseComplaint(req, res));

export default router;
