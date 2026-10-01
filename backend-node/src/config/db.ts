import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

/**
 * Get PostgreSQL database configuration.
 *
 * Production (Vercel):
 * Uses DATABASE_URL from Vercel Environment Variables.
 *
 * Local development:
 * You can also use DATABASE_URL from your local .env file.
 */
function getDatabaseConfig(): pg.PoolConfig {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;

  // Do not silently fall back to localhost.
  // If DATABASE_URL is missing, fail with a clear error.
  if (!connectionString || connectionString.includes('${')) {
    throw new Error(
      'DATABASE_URL is not configured. Please add DATABASE_URL to the environment variables.'
    );
  }

  const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  return {
    connectionString,

    // Render PostgreSQL requires SSL when accessed externally.
    // Local PostgreSQL can work without SSL.
    ssl: isLocal
      ? false
      : {
          rejectUnauthorized: false,
        },

    // Connection pool settings suitable for a serverless deployment.
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

/**
 * PostgreSQL connection pool
 */
export const pool = new Pool(getDatabaseConfig());

/**
 * Handle unexpected PostgreSQL client errors.
 */
pool.on('error', (err) => {
  console.error(
    'Unexpected error on idle PostgreSQL client:',
    err
  );
});

/**
 * Execute a PostgreSQL query.
 */
export async function query<
  T extends pg.QueryResultRow = any
>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}