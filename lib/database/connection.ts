/**
 * Database Connection Module
 * 
 * This module handles PostgreSQL database connections using a connection pool.
 * It provides a singleton pattern for database connections and includes
 * proper error handling, connection validation, and cleanup.
 * 
 * @module Database/Connection
 * @version 1.0.0
 */

import { Pool, PoolClient, PoolConfig } from 'pg';
import { DatabaseConfig, QueryResult } from './types';

/**
 * Singleton database connection pool instance
 */
let pool: Pool | null = null;

/**
 * Database configuration extracted from environment variables
 */
const dbConfig: DatabaseConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'like2win',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 30000,
  max: 20, // Maximum number of connections in pool
};

/**
 * Creates and configures a new database connection pool
 * 
 * @returns {Pool} Configured PostgreSQL connection pool
 */
function createPool(): Pool {
  const poolConfig: PoolConfig = {
    ...dbConfig,
    // Pool configuration
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

  // Use DATABASE_URL if provided (common in cloud environments)
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      ...poolConfig,
    });
  }

  return new Pool(poolConfig);
}

/**
 * Gets the database connection pool instance
 * Creates a new pool if one doesn't exist (singleton pattern)
 * 
 * @returns {Pool} Database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    pool = createPool();
    
    // Set up pool event handlers
    pool.on('connect', (client) => {
      console.log('New database client connected');
    });

    pool.on('remove', (client) => {
      console.log('Database client removed from pool');
    });

    pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });
  }

  return pool;
}

/**
 * Executes a SQL query with optional parameters
 * 
 * @param {string} text - SQL query string
 * @param {any[]} params - Query parameters for prepared statements
 * @returns {Promise<QueryResult<T>>} Query result with typed rows
 * 
 * @example
 * ```typescript
 * // Simple query
 * const result = await query('SELECT * FROM users WHERE id = $1', ['123']);
 * 
 * // Typed query
 * const users = await query<User>('SELECT * FROM users LIMIT 10');
 * ```
 */
export async function query<T = any>(
  text: string, 
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.warn(`Slow query detected (${duration}ms):`, {
        text: text.substring(0, 100),
        params: params?.slice(0, 5), // Limit logged params for security
      });
    }
    
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
      command: result.command,
    };
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`Database query error (${duration}ms):`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: text.substring(0, 100),
      params: params?.slice(0, 5),
    });
    throw error;
  }
}

/**
 * Executes a function within a database transaction
 * Automatically handles commit/rollback based on success/failure
 * 
 * @param {function} callback - Function to execute within transaction
 * @returns {Promise<T>} Result of the callback function
 * 
 * @example
 * ```typescript
 * const result = await withTransaction(async (client) => {
 *   await client.query('INSERT INTO users (fid) VALUES ($1)', [123]);
 *   await client.query('INSERT INTO raffle_entries (user_id, raffle_id) VALUES ($1, $2)', [userId, raffleId]);
 *   return { success: true };
 * });
 * ```
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Tests the database connection
 * 
 * @returns {Promise<boolean>} True if connection is successful, false otherwise
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as test');
    return result.rows.length > 0 && result.rows[0].test === 1;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Closes all database connections
 * Should be called when shutting down the application
 * 
 * @returns {Promise<void>}
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
}

/**
 * Gets current pool statistics
 * Useful for monitoring and debugging
 * 
 * @returns {object} Pool statistics
 */
export function getPoolStats(): object {
  const pool = getPool();
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

/**
 * Database health check
 * Provides detailed information about database connectivity and performance
 * 
 * @returns {Promise<object>} Health check results
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  connection: boolean;
  latency: number;
  poolStats: object;
  error?: string;
}> {
  const start = Date.now();
  
  try {
    const connectionTest = await testConnection();
    const latency = Date.now() - start;
    const poolStats = getPoolStats();
    
    return {
      status: connectionTest ? 'healthy' : 'unhealthy',
      connection: connectionTest,
      latency,
      poolStats,
    };
  } catch (error) {
    const latency = Date.now() - start;
    
    return {
      status: 'unhealthy',
      connection: false,
      latency,
      poolStats: getPoolStats(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connections...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connections...');
  await closePool();
  process.exit(0);
});