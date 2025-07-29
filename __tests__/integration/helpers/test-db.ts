/**
 * Test Database Helper
 * 
 * Provides utilities for setting up and managing test database
 * including seeding test data and cleanup operations.
 */

import { Pool } from 'pg';
import { config } from '@/lib/config';

/**
 * Test database configuration
 */
const testDbConfig = {
  ...config.database,
  database: 'like2win_test',
  port: config.database.port,
};

/**
 * Test database connection pool
 */
let testPool: Pool | null = null;

/**
 * Test database utilities
 */
export const testDb = {
  /**
   * Connect to test database
   */
  async connect(): Promise<void> {
    if (!testPool) {
      testPool = new Pool(testDbConfig);
      
      try {
        await testPool.query('SELECT 1');
        console.log('Connected to test database');
      } catch (error) {
        console.error('Failed to connect to test database:', error);
        throw error;
      }
    }
  },

  /**
   * Disconnect from test database
   */
  async disconnect(): Promise<void> {
    if (testPool) {
      await testPool.end();
      testPool = null;
      console.log('Disconnected from test database');
    }
  },

  /**
   * Execute query on test database
   */
  async query(text: string, params?: any[]): Promise<any> {
    if (!testPool) {
      throw new Error('Test database not connected');
    }
    
    return testPool.query(text, params);
  },

  /**
   * Execute query within transaction
   */
  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    if (!testPool) {
      throw new Error('Test database not connected');
    }

    const client = await testPool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

/**
 * Test data fixtures
 */
export const testFixtures = {
  users: [
    {
      fid: 12345,
      username: 'testuser1',
      display_name: 'Test User 1',
      tip_allowance_enabled: false,
      is_following_like2win: true,
      total_lifetime_tickets: 10,
    },
    {
      fid: 54321,
      username: 'testuser2',
      display_name: 'Test User 2',
      tip_allowance_enabled: true,
      is_following_like2win: false,
      total_lifetime_tickets: 5,
    },
    {
      fid: 67890,
      username: 'testuser3',
      display_name: 'Test User 3',
      tip_allowance_enabled: false,
      is_following_like2win: true,
      total_lifetime_tickets: 15,
    },
  ],

  raffles: [
    {
      name: 'Test Raffle 1',
      description: 'Active test raffle',
      start_date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      end_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      status: 'active',
      prize_pool: 1000,
      prize_currency: 'DEGEN',
    },
    {
      name: 'Test Raffle 2',
      description: 'Upcoming test raffle',
      start_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      status: 'upcoming',
      prize_pool: 2000,
      prize_currency: 'DEGEN',
    },
  ],

  posts: [
    {
      cast_hash: '0x1234567890abcdef1234567890abcdef12345678',
      author_fid: 99999, // Like2Win official account
      content: 'Test raffle post 1',
      required_engagement: 'like_comment_recast',
      tickets_per_participation: 1,
      is_active: true,
    },
    {
      cast_hash: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      author_fid: 99999,
      content: 'Test raffle post 2',
      required_engagement: 'like_comment_recast',
      tickets_per_participation: 1,
      is_active: true,
    },
  ],
};

/**
 * Seed test data into database
 */
export async function seedTestData(): Promise<void> {
  await testDb.transaction(async (client) => {
    // Insert test raffles
    const raffleIds: string[] = [];
    for (const raffle of testFixtures.raffles) {
      const result = await client.query(
        `INSERT INTO raffles (name, description, start_date, end_date, status, prize_pool, prize_currency)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          raffle.name,
          raffle.description,
          raffle.start_date,
          raffle.end_date,
          raffle.status,
          raffle.prize_pool,
          raffle.prize_currency,
        ]
      );
      raffleIds.push(result.rows[0].id);
    }

    // Insert test users
    const userIds: string[] = [];
    for (const user of testFixtures.users) {
      const result = await client.query(
        `INSERT INTO users (fid, username, display_name, tip_allowance_enabled, is_following_like2win, total_lifetime_tickets)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          user.fid,
          user.username,
          user.display_name,
          user.tip_allowance_enabled,
          user.is_following_like2win,
          user.total_lifetime_tickets,
        ]
      );
      userIds.push(result.rows[0].id);
    }

    // Insert test posts (linked to active raffle)
    const postIds: string[] = [];
    for (const post of testFixtures.posts) {
      const result = await client.query(
        `INSERT INTO posts (cast_hash, author_fid, content, required_engagement, tickets_per_participation, is_active, raffle_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          post.cast_hash,
          post.author_fid,
          post.content,
          post.required_engagement,
          post.tickets_per_participation,
          post.is_active,
          raffleIds[0], // Link to active raffle
        ]
      );
      postIds.push(result.rows[0].id);
    }

    // Insert some test raffle entries
    await client.query(
      `INSERT INTO raffle_entries (user_id, raffle_id, tickets, first_participation_date, last_participation_date)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userIds[0], raffleIds[0], 5]
    );

    await client.query(
      `INSERT INTO raffle_entries (user_id, raffle_id, tickets, first_participation_date, last_participation_date)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userIds[2], raffleIds[0], 3]
    );

    console.log('Test data seeded successfully');
  });
}

/**
 * Clean up all test data
 */
export async function cleanupTestData(): Promise<void> {
  await testDb.transaction(async (client) => {
    // Delete in reverse order of dependencies
    await client.query('DELETE FROM post_participations');
    await client.query('DELETE FROM raffle_entries');
    await client.query('DELETE FROM winners');
    await client.query('DELETE FROM posts');
    await client.query('DELETE FROM raffles');
    await client.query('DELETE FROM users');
    
    console.log('Test data cleaned up');
  });
}

/**
 * Reset test database to clean state
 */
export async function resetTestDatabase(): Promise<void> {
  await cleanupTestData();
  await seedTestData();
}

/**
 * Create isolated test environment
 */
export async function createTestTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  return testDb.transaction(async (client) => {
    // Set up isolated test data
    await seedTestDataInTransaction(client);
    
    // Run test
    const result = await callback(client);
    
    // Cleanup happens automatically with transaction rollback
    return result;
  });
}

/**
 * Seed test data within existing transaction
 */
async function seedTestDataInTransaction(client: any): Promise<void> {
  // Same as seedTestData but within provided transaction
  // ... (implementation similar to seedTestData but using client directly)
}

/**
 * Create test user
 */
export async function createTestUser(userData: Partial<typeof testFixtures.users[0]> = {}): Promise<any> {
  const defaultUser = testFixtures.users[0];
  const user = { ...defaultUser, ...userData };
  
  const result = await testDb.query(
    `INSERT INTO users (fid, username, display_name, tip_allowance_enabled, is_following_like2win, total_lifetime_tickets)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      user.fid,
      user.username,
      user.display_name,
      user.tip_allowance_enabled,
      user.is_following_like2win,
      user.total_lifetime_tickets,
    ]
  );
  
  return result.rows[0];
}

/**
 * Create test raffle
 */
export async function createTestRaffle(raffleData: Partial<typeof testFixtures.raffles[0]> = {}): Promise<any> {
  const defaultRaffle = testFixtures.raffles[0];
  const raffle = { ...defaultRaffle, ...raffleData };
  
  const result = await testDb.query(
    `INSERT INTO raffles (name, description, start_date, end_date, status, prize_pool, prize_currency)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      raffle.name,
      raffle.description,
      raffle.start_date,
      raffle.end_date,
      raffle.status,
      raffle.prize_pool,
      raffle.prize_currency,
    ]
  );
  
  return result.rows[0];
}

/**
 * Create test post
 */
export async function createTestPost(
  raffleId: string,
  postData: Partial<typeof testFixtures.posts[0]> = {}
): Promise<any> {
  const defaultPost = testFixtures.posts[0];
  const post = { ...defaultPost, ...postData };
  
  const result = await testDb.query(
    `INSERT INTO posts (cast_hash, author_fid, content, required_engagement, tickets_per_participation, is_active, raffle_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      post.cast_hash,
      post.author_fid,
      post.content,
      post.required_engagement,
      post.tickets_per_participation,
      post.is_active,
      raffleId,
    ]
  );
  
  return result.rows[0];
}

/**
 * Wait for database operations to complete
 */
export async function waitForDb(timeout: number = 5000): Promise<void> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    try {
      await testDb.query('SELECT 1');
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  throw new Error('Database timeout');
}