import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initDb } from './config/initDb.js';

import authRoutes from './routes/authRoutes.js';
import batteryRoutes from './routes/batteryRoutes.js';
import chargingRoutes from './routes/chargingRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import evRoutes from './routes/evRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';

const app = express();

// CORS configuration supporting local Vite frontend and remote clients
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or serverless)
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Email', 'x-user-email']
  })
);

app.use(express.json());

// Database Initialization Middleware
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await initDb();
    next();
  } catch (err) {
    console.error('Failed to initialize database during request:', err);
    res.status(500).json({ error: 'Database initialization failure', details: (err as any).message });
  }
});

// Root & Health check
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'UP',
    service: 'EcoCare Node.js Backend',
    deployment: 'Vercel Serverless / Node.js Standalone',
    endpoints: [
      '/api/auth',
      '/api/battery',
      '/api/charging-stations',
      '/api/company',
      '/api/evs',
      '/api/marketplace'
    ]
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/battery', batteryRoutes);
app.use('/api/charging-stations', chargingRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/evs', evRoutes);
app.use('/api/marketplace', marketplaceRoutes);

export default app;
