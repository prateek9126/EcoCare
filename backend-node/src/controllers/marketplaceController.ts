import { Request, Response } from 'express';
import { query } from '../config/db.js';
import { BatteryListing } from '../types/index.js';

function mapListing(r: any): BatteryListing {
  return {
    id: r.id,
    vehicleType: r.vehicle_type,
    phoneNumber: r.phone_number,
    manufacturer: r.manufacturer,
    model: r.model,
    chemistry: r.chemistry,
    capacity: r.capacity != null ? Number(r.capacity) : undefined,
    estimatedSoH: r.estimated_soh != null ? Number(r.estimated_soh) : undefined,
    chargingCycles: r.charging_cycles != null ? Number(r.charging_cycles) : undefined,
    batteryAge: r.battery_age != null ? Number(r.battery_age) : undefined,
    price: r.price != null ? Number(r.price) : undefined,
    city: r.city,
    state: r.state,
    description: r.description,
    imageUrl: r.image_url,
    status: r.status,
    createdAt: r.created_at
  };
}

export class MarketplaceController {
  async createListing(req: Request, res: Response) {
    try {
      const b = req.body;
      const insRes = await query(
        `INSERT INTO battery_listings 
          (vehicle_type, phone_number, manufacturer, model, chemistry, capacity, estimated_soh, 
           charging_cycles, battery_age, price, city, state, description, image_url, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [
          b.vehicleType || b.vehicle_type,
          b.phoneNumber || b.phone_number,
          b.manufacturer,
          b.model,
          b.chemistry,
          b.capacity,
          b.estimatedSoH ?? b.estimated_soh,
          b.chargingCycles ?? b.charging_cycles,
          b.batteryAge ?? b.battery_age,
          b.price,
          b.city,
          b.state,
          b.description,
          b.imageUrl || b.image_url,
          b.status || 'AVAILABLE'
        ]
      );
      return res.json(mapListing(insRes.rows[0]));
    } catch (err: any) {
      console.error('Error creating listing:', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async getListings(req: Request, res: Response) {
    try {
      const { city, state, maxPrice, minSoh, vehicleType, chemistry, status } = req.query;

      const conditions: string[] = [];
      const params: any[] = [];

      if (city && typeof city === 'string' && city.trim().length > 0) {
        params.push(city.trim().toLowerCase());
        conditions.push(`LOWER(city) = $${params.length}`);
      }

      if (state && typeof state === 'string' && state.trim().length > 0) {
        params.push(state.trim().toLowerCase());
        conditions.push(`LOWER(state) = $${params.length}`);
      }

      if (maxPrice && !isNaN(Number(maxPrice))) {
        params.push(Number(maxPrice));
        conditions.push(`price <= $${params.length}`);
      }

      if (minSoh && !isNaN(Number(minSoh))) {
        params.push(Number(minSoh));
        conditions.push(`estimated_soh >= $${params.length}`);
      }

      if (vehicleType && typeof vehicleType === 'string' && vehicleType.trim().length > 0) {
        params.push(vehicleType.trim().toLowerCase());
        conditions.push(`LOWER(vehicle_type) = $${params.length}`);
      }

      if (chemistry && typeof chemistry === 'string' && chemistry.trim().length > 0) {
        params.push(chemistry.trim().toLowerCase());
        conditions.push(`LOWER(chemistry) = $${params.length}`);
      }

      if (status && typeof status === 'string' && status.trim().length > 0) {
        params.push(status.trim().toUpperCase());
        conditions.push(`UPPER(status) = $${params.length}`);
      } else {
        conditions.push("status = 'AVAILABLE'");
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const sql = `SELECT * FROM battery_listings ${whereClause} ORDER BY created_at DESC`;

      const dbRes = await query(sql, params);
      return res.json(dbRes.rows.map(mapListing));
    } catch (err: any) {
      console.error('Error fetching listings:', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async getListingById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dbRes = await query('SELECT * FROM battery_listings WHERE id = $1', [id]);
      if (dbRes.rows.length === 0) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      return res.json(mapListing(dbRes.rows[0]));
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async updateListing(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const b = req.body;

      const chk = await query('SELECT id FROM battery_listings WHERE id = $1', [id]);
      if (chk.rows.length === 0) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      const updateRes = await query(
        `UPDATE battery_listings SET
          vehicle_type = $1,
          phone_number = $2,
          manufacturer = $3,
          model = $4,
          chemistry = $5,
          capacity = $6,
          estimated_soh = $7,
          charging_cycles = $8,
          battery_age = $9,
          price = $10,
          city = $11,
          state = $12,
          description = $13,
          image_url = $14,
          status = $15
         WHERE id = $16
         RETURNING *`,
        [
          b.vehicleType || b.vehicle_type,
          b.phoneNumber || b.phone_number,
          b.manufacturer,
          b.model,
          b.chemistry,
          b.capacity,
          b.estimatedSoH ?? b.estimated_soh,
          b.chargingCycles ?? b.charging_cycles,
          b.batteryAge ?? b.battery_age,
          b.price,
          b.city,
          b.state,
          b.description,
          b.imageUrl || b.image_url,
          b.status,
          id
        ]
      );

      return res.json(mapListing(updateRes.rows[0]));
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async deleteListing(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const chk = await query('SELECT id FROM battery_listings WHERE id = $1', [id]);
      if (chk.rows.length === 0) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      await query('DELETE FROM battery_listings WHERE id = $1', [id]);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  // --- Digital Battery Passport Linking ---

  async linkPassport(req: Request, res: Response) {
    try {
      const { phoneNumber, vehicleId } = req.body;
      if (!phoneNumber || !vehicleId) {
        return res.status(400).json({ success: false, message: 'Phone number and Vehicle ID are required.' });
      }

      const cleanPhone = phoneNumber.trim();
      const cleanVehicleId = vehicleId.trim();

      const aRes = await query(
        'SELECT id FROM battery_analyses WHERE LOWER(vehicle_id) = $1 ORDER BY created_at DESC LIMIT 1',
        [cleanVehicleId.toLowerCase()]
      );

      if (aRes.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No battery passport exists for this Vehicle ID. Please generate a diagnostic passport first.'
        });
      }

      const assessmentId = aRes.rows[0].id;

      const linkCheck = await query('SELECT id FROM passport_links WHERE phone_number = $1', [cleanPhone]);
      if (linkCheck.rows.length > 0) {
        await query(
          'UPDATE passport_links SET vehicle_id = $1, assessment_id = $2 WHERE phone_number = $3',
          [cleanVehicleId, assessmentId, cleanPhone]
        );
      } else {
        await query(
          'INSERT INTO passport_links (phone_number, vehicle_id, assessment_id) VALUES ($1, $2, $3)',
          [cleanPhone, cleanVehicleId, assessmentId]
        );
      }

      return res.json({
        success: true,
        message: `Phone number successfully linked to Vehicle ID ${cleanVehicleId} and battery passport.`
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async sendPassportOtp(req: Request, res: Response) {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ success: false, message: 'Phone number is required.' });
      }

      const cleanPhone = phoneNumber.trim();
      const linkRes = await query('SELECT * FROM passport_links WHERE phone_number = $1', [cleanPhone]);
      if (linkRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'No battery passport is linked to this phone number.' });
      }

      const userRes = await query('SELECT * FROM users WHERE phone_number = $1', [cleanPhone]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'No registered user found with this phone number.' });
      }

      const user = userRes.rows[0];
      const gmail = user.gmail.toLowerCase();

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

      const otpRes = await query('SELECT id FROM otp_verifications WHERE LOWER(gmail) = $1', [gmail]);
      if (otpRes.rows.length > 0) {
        await query('UPDATE otp_verifications SET otp = $1, expiry_time = $2 WHERE LOWER(gmail) = $3', [
          otp,
          expiryTime,
          gmail
        ]);
      } else {
        await query('INSERT INTO otp_verifications (gmail, otp, expiry_time) VALUES ($1, $2, $3)', [
          gmail,
          otp,
          expiryTime
        ]);
      }

      console.log(`>>> [PASSPORT OTP] Authorization OTP code for ${gmail}: ${otp}`);

      return res.json({
        success: true,
        message: `OTP generated successfully. (Authorization code: ${otp})`,
        otp
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async verifyPassportOtp(req: Request, res: Response) {
    try {
      const { phoneNumber, otp } = req.body;
      if (!phoneNumber || !otp) {
        return res.status(400).json({ success: false, message: 'Phone number and OTP are required.' });
      }

      const cleanPhone = phoneNumber.trim();
      const cleanOtp = String(otp).trim();

      const linkRes = await query('SELECT * FROM passport_links WHERE phone_number = $1', [cleanPhone]);
      if (linkRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'No passport link found for this phone number.' });
      }
      const link = linkRes.rows[0];

      const userRes = await query('SELECT * FROM users WHERE phone_number = $1', [cleanPhone]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'No user found associated with this phone number.' });
      }
      const user = userRes.rows[0];

      const otpRes = await query('SELECT * FROM otp_verifications WHERE LOWER(gmail) = $1', [user.gmail.toLowerCase()]);
      if (otpRes.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'No OTP record found. Please request OTP first.' });
      }

      const otpRec = otpRes.rows[0];
      if (new Date(otpRec.expiry_time) < new Date()) {
        return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      }

      if (otpRec.otp !== cleanOtp) {
        return res.status(400).json({ success: false, message: 'Incorrect OTP. Verification failed.' });
      }

      await query('DELETE FROM otp_verifications WHERE LOWER(gmail) = $1', [user.gmail.toLowerCase()]);

      const aRes = await query('SELECT * FROM battery_analyses WHERE id = $1', [link.assessment_id]);
      if (aRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Linked battery passport could not be found.' });
      }

      const assessment = aRes.rows[0];
      const hRes = await query(
        'SELECT * FROM battery_analyses WHERE LOWER(vehicle_id) = $1 ORDER BY created_at ASC',
        [link.vehicle_id.toLowerCase()]
      );

      return res.json({
        success: true,
        assessment,
        history: hRes.rows
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const marketplaceController = new MarketplaceController();
