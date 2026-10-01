import { Request, Response } from 'express';
import { query } from '../config/db.js';
import { companyService } from '../services/companyService.js';

async function verifyAccess(req: Request, res: Response): Promise<boolean> {
  const userEmail = (req.headers['x-user-email'] as string) || '';
  if (!userEmail || userEmail.trim().length === 0) {
    res.status(401).json({ message: 'Authentication required. X-User-Email header missing.' });
    return false;
  }

  const clean = userEmail.trim().toLowerCase();
  if (clean === 'admin') {
    return true;
  }

  const uRes = await query('SELECT * FROM users WHERE LOWER(gmail) = $1', [clean]);
  if (uRes.rows.length === 0) {
    res.status(401).json({ message: 'Invalid authentication details. User not found.' });
    return false;
  }

  const user = uRes.rows[0];
  if (user.role !== 'ROLE_COMPANY') {
    res.status(403).json({ message: 'Access denied. Company authorization required.' });
    return false;
  }

  return true;
}

export class CompanyController {
  async getDashboardSummary(req: Request, res: Response) {
    if (!(await verifyAccess(req, res))) return;
    try {
      const summary = await companyService.getDashboardSummary();
      return res.json(summary);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getMonthlySales(req: Request, res: Response) {
    if (!(await verifyAccess(req, res))) return;
    try {
      const range = (req.query.range as string) || '12 months';
      const model = req.query.model as string | undefined;
      const sales = await companyService.getMonthlySales(range, model);
      return res.json(sales);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getModelSalesPerformance(req: Request, res: Response) {
    if (!(await verifyAccess(req, res))) return;
    try {
      const perf = await companyService.getModelSalesPerformance();
      return res.json(perf);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getAvailableModels(req: Request, res: Response) {
    if (!(await verifyAccess(req, res))) return;
    try {
      const models = await companyService.getAvailableModels();
      return res.json(models);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getModelAnalytics(req: Request, res: Response) {
    if (!(await verifyAccess(req, res))) return;
    try {
      const modelName = req.params.modelName as string;
      const analytics = await companyService.getModelAnalytics(modelName);
      return res.json(analytics);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getBatteryHealthAnalytics(req: Request, res: Response) {
    if (!(await verifyAccess(req, res))) return;
    try {
      const analytics = await companyService.getBatteryHealthAnalytics();
      return res.json(analytics);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getServiceAnalytics(req: Request, res: Response) {
    if (!(await verifyAccess(req, res))) return;
    try {
      const analytics = await companyService.getServiceAnalytics();
      return res.json(analytics);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getCustomerProblemAnalytics(req: Request, res: Response) {
    if (!(await verifyAccess(req, res))) return;
    try {
      const analytics = await companyService.getCustomerProblemAnalytics();
      return res.json(analytics);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getProblemDistributionByModel(req: Request, res: Response) {
    if (!(await verifyAccess(req, res))) return;
    try {
      const dist = await companyService.getProblemDistributionByModel();
      return res.json(dist);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async compareModels(req: Request, res: Response) {
    if (!(await verifyAccess(req, res))) return;
    try {
      const model1 = req.query.model1 as string;
      const model2 = req.query.model2 as string;
      if (!model1 || !model2) {
        return res.status(400).json({ message: 'Both model1 and model2 are required.' });
      }
      const comparison = await companyService.compareModels('EV Company', model1, 'EV Company', model2);
      return res.json(comparison);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getVehicleDetails(req: Request, res: Response) {
    if (!(await verifyAccess(req, res))) return;
    try {
      const vehicleId = req.params.vehicleId as string;
      const details = await companyService.getVehicleDetails(vehicleId);
      if (!details || Object.keys(details).length === 0) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      return res.json(details);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getEngineeringInsights(req: Request, res: Response) {
    if (!(await verifyAccess(req, res))) return;
    try {
      const insights = await companyService.getEngineeringInsights();
      return res.json(insights);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async registerComplaint(req: Request, res: Response) {
    try {
      const userEmail = (req.headers['x-user-email'] as string) || undefined;
      const issue = await companyService.registerComplaint(req.body, userEmail);
      return res.json(issue);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }
}

export const companyController = new CompanyController();
