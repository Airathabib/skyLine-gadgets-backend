import { Client } from 'pg';
import bcrypt from 'bcrypt';
import dbJsonRaw from '../../db.json' with { type: 'json' };
import type { DbJson } from './dbJsonTypes.js';

const dbJson = dbJsonRaw as DbJson;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

const migrate = async () => {
  try {
    await client.connect();
    console.log('✅ Подключено к PostgreSQL');

    // 1. Создание таблиц
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        login TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        role TEXT DEFAULT 'user'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        brand TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        accum TEXT,
        memory TEXT,
        photo TEXT,
        rating REAL NOT NULL DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS brands (
        name TEXT PRIMARY KEY
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        parent_id INTEGER,
        user_name TEXT NOT NULL,
        user_comment TEXT NOT NULL,
        date TEXT NOT NULL,
        productId TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        productId TEXT NOT NULL,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(userId, productId)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        productId TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        productId TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(userId, productId)
      );
    `);

    console.log('✅ Таблицы созданы');

    // 2. Миграция брендов
    for (const brand of dbJson.brands || []) {
      await client.query(
        'INSERT INTO brands (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [brand]
      );
    }
    console.log(`✅ Мигрировано ${dbJson.brands?.length || 0} брендов`);

    // 3. Миграция пользователей
    for (const u of dbJson.users || []) {
      const hashed = await bcrypt.hash(u.password, 10);
      await client.query(
        `INSERT INTO users (login, password, email, phone, role)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (login) DO NOTHING`,
        [u.login, hashed, u.email, u.phone, u.role || 'user']
      );
    }

    // Добавим админа, если его нет
    const adminHash = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO users (login, password, email, phone, role)
       VALUES ($1, $2, $3, $4, 'admin')
       ON CONFLICT (login) DO NOTHING`,
      ['admin', adminHash, 'admin@example.com', '+70000000000', 'admin']
    );

    console.log(`✅ Мигрированы пользователи`);

    // 4. Миграция товаров
    for (const p of dbJson.products || []) {
      await client.query(
        `INSERT INTO products (id, brand, category, quantity, title, description, price, accum, memory, photo, rating)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [
          p.id,
          p.brand,
          p.category,
          p.quantity || 0,
          p.title,
          p.description,
          p.price,
          p.accum || '',
          p.memory || '',
          p.photo || '',
          p.rating || 0,
        ]
      );
    }
    console.log(`✅ Мигрировано ${dbJson.products?.length || 0} товаров`);

    // 5. Миграция комментариев
    for (const c of dbJson.comments || []) {
      const userName = typeof c.user_name === 'string' ? c.user_name : 'Аноним';
      await client.query(
        `INSERT INTO comments (userId, parent_id, userName, userComment, date, productId)
     VALUES (
       (SELECT id FROM users WHERE login = $1 LIMIT 1),
       $2,
       $3,
       $4,
       $5,
       $6
     )`,
        [
          userName,
          null, // parent_id
          c.user_comment,
          c.date,
          c.productId,
        ]
      );
    }
    console.log(`✅ Мигрировано ${dbJson.comments?.length || 0} комментариев`);
    console.log('🎉 Миграция завершена успешно!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка миграции:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
};

migrate();
