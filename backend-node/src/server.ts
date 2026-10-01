import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { initDb } from './config/initDb.js';

const PORT = process.env.PORT || 8080;

async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`  EcoCare Node.js Backend Server Running!        `);
      console.log(`  Listening on: http://localhost:${PORT}        `);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
