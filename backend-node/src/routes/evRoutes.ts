import { Router } from 'express';
import { evController } from '../controllers/evController.js';

const router = Router();

router.get('/', (req, res) => evController.getAllEvs(req, res));
router.get('/all', (req, res) => evController.getAllEvs(req, res));
router.post('/recommend', (req, res) => evController.recommendEvs(req, res));
router.get('/compare', (req, res) => evController.compareEvs(req, res));
router.get('/dealers', (req, res) => evController.getDealers(req, res));
router.get('/service-centers', (req, res) => evController.getServiceCenters(req, res));
router.get('/:id', (req, res) => evController.getEvById(req, res));

export default router;
