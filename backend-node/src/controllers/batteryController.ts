import { Request, Response } from 'express';
import { batteryService } from '../services/batteryAnalysisService.js';
import { companyService } from '../services/companyService.js';

export class BatteryController {
  async analyzeBattery(req: Request, res: Response) {
    try {
      const userEmail = (req.headers['x-user-email'] as string) || undefined;
      const result = await batteryService.analyzeAndSave(req.body, userEmail);
      return res.json(result);
    } catch (err: any) {
      if (err.message && err.message.includes('registered to another user')) {
        return res.status(403).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message });
    }
  }

  async getVehicleHistory(req: Request, res: Response) {
    try {
      const vehicleId = req.params.vehicleId as string;
      const userEmail = (req.headers['x-user-email'] as string) || undefined;

      const vehicle = await batteryService.findVehicleByVehicleId(vehicleId, userEmail);
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found or unauthorized' });
      }

      const history = await batteryService.getHistoryByVehicleId(vehicleId, userEmail);
      return res.json({ vehicle, history });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getBatteryHistory(req: Request, res: Response) {
    return this.getVehicleHistory(req, res);
  }

  async getAnalysisHistory(req: Request, res: Response) {
    try {
      const userEmail = (req.headers['x-user-email'] as string) || undefined;
      const { manufacturer, model } = req.query;

      let history;
      if (manufacturer && model) {
        history = await batteryService.getHistoryByModel(userEmail, String(manufacturer), String(model));
      } else {
        history = await batteryService.getHistory(userEmail);
      }
      return res.json(history);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getVehicles(req: Request, res: Response) {
    try {
      const userEmail = (req.headers['x-user-email'] as string) || undefined;
      const vehicles = await batteryService.getVehiclesByUserEmail(userEmail);
      const response: any[] = [];

      for (const v of vehicles) {
        const history = await batteryService.getHistoryByVehicleId(v.vehicleId, userEmail);
        if (history.length === 0) continue;

        const latest = history[history.length - 1];
        response.push({
          vehicleId: v.vehicleId,
          manufacturer: v.manufacturer,
          model: v.model,
          vehicleType: v.vehicleType,
          lastChecked: latest.createdAt,
          lastStatus: latest.condition,
          lastScore: latest.soh,
          assessmentsCount: history.length
        });
      }

      return res.json(response);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getPublicAssessment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await batteryService.getPublicAssessment(Number(id));
      if (!data) {
        return res.status(404).json({ message: 'Assessment not found' });
      }
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async clearHistory(req: Request, res: Response) {
    try {
      await batteryService.clearHistory();
      return res.send('Analysis history cleared successfully.');
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async raiseComplaint(req: Request, res: Response) {
    try {
      const userEmail = (req.headers['x-user-email'] as string) || undefined;
      const issue = await companyService.registerComplaint(req.body, userEmail);
      return res.json(issue);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }
}

export const batteryController = new BatteryController();
