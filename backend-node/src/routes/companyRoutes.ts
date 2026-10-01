import { Router } from 'express';
import { companyController } from '../controllers/companyController.js';

const router = Router();

router.get('/dashboard/summary', (req, res) => companyController.getDashboardSummary(req, res));
router.get('/sales/monthly', (req, res) => companyController.getMonthlySales(req, res));
router.get('/sales/models', (req, res) => companyController.getModelSalesPerformance(req, res));
router.get('/models', (req, res) => companyController.getAvailableModels(req, res));
router.get('/models/compare', (req, res) => companyController.compareModels(req, res));
router.get('/models/:modelName', (req, res) => companyController.getModelAnalytics(req, res));
router.get('/battery-health', (req, res) => companyController.getBatteryHealthAnalytics(req, res));
router.get('/service/summary', (req, res) => companyController.getServiceAnalytics(req, res));
router.get('/service/problems', (req, res) => companyController.getCustomerProblemAnalytics(req, res));
router.get('/service/problems/by-model', (req, res) => companyController.getProblemDistributionByModel(req, res));
router.get('/vehicles/:vehicleId', (req, res) => companyController.getVehicleDetails(req, res));
router.get('/insights', (req, res) => companyController.getEngineeringInsights(req, res));
router.post('/service/complaints', (req, res) => companyController.registerComplaint(req, res));
router.post('/complaints', (req, res) => companyController.registerComplaint(req, res));

export default router;
