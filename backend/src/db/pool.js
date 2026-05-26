import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const useSsl = /^(1|true|yes)$/i.test(process.env.PGSSL || '')
  || (process.env.DATABASE_URL || '').includes('supabase.co')
  || (process.env.DATABASE_URL || '').includes('supabase.com');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: process.env.VERCEL ? 1 : 10,
});

export const query = (text, params) => pool.query(text, params);
