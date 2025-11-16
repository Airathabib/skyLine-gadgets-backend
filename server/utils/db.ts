import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();
// Используем DATABASE_URL из среды (Render задаст его автоматически)
// Локально — подставь свой URL
// const DATABASE_URL =
//   process.env.DATABASE_URL ||
//   'postgres://postgres:qwerty@localhost:5432/skyline_gadgets';

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://localhost:5432/skyline_gadgets';

const pool = new Pool({
  connectionString: DATABASE_URL,
  // Для Render — включаем SSL
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

export default pool;
