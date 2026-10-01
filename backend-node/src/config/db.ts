import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

function getDatabaseConfig() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;

  if (!connectionString || connectionString.includes('${')) {
    throw new Error(
      'DATABASE_URL is not configured. Please add DATABASE_URL to Vercel Environment Variables.'
    );
  }

  const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  return {
    connectionString,

    ssl: isLocal
      ? false
      : {
          rejectUnauthorized: false,
        },

    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

export const pool = new Pool(getDatabaseConfig());

pool.on('error', (err) => {
  console.error(
    'Unexpected error on idle PostgreSQL client:',
    err
  );
});

export async function query(text, params) {
  return pool.query(text, params);
}