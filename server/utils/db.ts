import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL =
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV !== 'production'
    ? 'postgres://localhost:5432/skyline_gadgets'
    : undefined);

if (!DATABASE_URL) {
  throw new Error('❌ DATABASE_URL required in production!');
}

if (!DATABASE_URL) {
  throw new Error('❌ Переменная DATABASE_URL не задана!');
}

const pool = new Pool({
  connectionString: DATABASE_URL,

  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

export default pool;
