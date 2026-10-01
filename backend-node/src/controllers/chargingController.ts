import { Request, Response } from 'express';
import { query } from '../config/db.js';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const latDistance = ((lat2 - lat1) * Math.PI) / 180;
  const lonDistance = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class ChargingController {
  async getNearbyStations(req: Request, res: Response) {
    try {
      const latitude = Number(req.query.latitude);
      const longitude = Number(req.query.longitude);
      const radius = req.query.radius ? Number(req.query.radius) : 50;

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: 'Valid latitude and longitude are required.' });
      }

      const stationsRes = await query('SELECT * FROM charging_stations');
      const nearby = stationsRes.rows
        .map((s) => {
          const dist = calculateDistance(latitude, longitude, Number(s.latitude), Number(s.longitude));
          const roundedDist = Math.round(dist * 10) / 10;
          return {
            id: s.id,
            name: s.name,
            latitude: Number(s.latitude),
            longitude: Number(s.longitude),
            totalPorts: s.total_ports,
            availablePorts: s.available_ports,
            chargerType: s.charger_type,
            powerKw: s.power_kw,
            status: s.status,
            locationName: s.location_name,
            distanceKm: roundedDist
          };
        })
        .filter((s) => s.distanceKm <= radius)
        .sort((a, b) => a.distanceKm - b.distanceKm);

      return res.json(nearby);
    } catch (err: any) {
      console.error('Error in getNearbyStations:', err);
      return res.status(500).json({ message: err.message });
    }
  }
}

export const chargingController = new ChargingController();
