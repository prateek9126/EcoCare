import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

export class AuthController {
  async sendOtp(req: Request, res: Response) {
    try {
      const { gmail } = req.body;
      if (!gmail || typeof gmail !== 'string' || gmail.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Gmail is required.' });
      }
      const cleanGmail = gmail.trim().toLowerCase();

      // Check if user already exists
      const userRes = await query('SELECT id FROM users WHERE LOWER(gmail) = $1', [cleanGmail]);
      if (userRes.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Gmail is already registered.' });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

      // Save or update OTP
      const otpRes = await query('SELECT id FROM otp_verifications WHERE LOWER(gmail) = $1', [cleanGmail]);
      if (otpRes.rows.length > 0) {
        await query(
          'UPDATE otp_verifications SET otp = $1, expiry_time = $2 WHERE LOWER(gmail) = $3',
          [otp, expiryTime, cleanGmail]
        );
      } else {
        await query(
          'INSERT INTO otp_verifications (gmail, otp, expiry_time) VALUES ($1, $2, $3)',
          [cleanGmail, otp, expiryTime]
        );
      }

      console.log(`>>> [AUTH OTP] Verification code for ${cleanGmail}: ${otp}`);

      return res.json({
        success: true,
        message: `Verification code generated: ${otp}`,
        otp
      });
    } catch (err: any) {
      console.error('Error in sendOtp:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { name, phoneNumber, gmail, password, otp, role } = req.body;

      if (!name || !gmail || !password || !otp) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
      }

      const cleanGmail = gmail.trim().toLowerCase();
      const cleanOtp = String(otp).trim();

      // Verify OTP
      const otpRes = await query('SELECT * FROM otp_verifications WHERE LOWER(gmail) = $1', [cleanGmail]);
      if (otpRes.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'No OTP record found. Please send OTP first.' });
      }

      const otpRec = otpRes.rows[0];
      if (new Date(otpRec.expiry_time) < new Date()) {
        return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      }

      if (otpRec.otp !== cleanOtp) {
        return res.status(400).json({ success: false, message: 'Incorrect OTP. Verification failed.' });
      }

      // Check if user exists
      const userRes = await query('SELECT id FROM users WHERE LOWER(gmail) = $1', [cleanGmail]);
      if (userRes.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Gmail is already registered.' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      const userRole = role || 'ROLE_USER';

      await query(
        'INSERT INTO users (name, phone_number, gmail, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        [name.trim(), phoneNumber ? phoneNumber.trim() : null, cleanGmail, passwordHash, userRole]
      );

      // Clean OTP
      await query('DELETE FROM otp_verifications WHERE LOWER(gmail) = $1', [cleanGmail]);

      return res.json({ success: true, message: 'Registration successful. You can now log in.' });
    } catch (err: any) {
      console.error('Error in register:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { gmail, password } = req.body;

      if (!gmail || !password) {
        return res.status(400).json({ success: false, message: 'Gmail and password are required.' });
      }

      const cleanGmail = gmail.trim().toLowerCase();
      const userRes = await query('SELECT * FROM users WHERE LOWER(gmail) = $1', [cleanGmail]);
      if (userRes.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid email or password.' });
      }

      const user = userRes.rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(400).json({ success: false, message: 'Invalid email or password.' });
      }

      return res.json({
        success: true,
        name: user.name,
        gmail: user.gmail,
        role: user.role
      });
    } catch (err: any) {
      console.error('Error in login:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const authController = new AuthController();
