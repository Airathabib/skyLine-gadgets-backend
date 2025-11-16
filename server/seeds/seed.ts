import db from '../utils/db.js';
import dbJsonRaw from '../../db.json' with { type: 'json' };
import type { DbJson } from  '../scripts/dbJsonTypes.js'
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const dbJson = dbJsonRaw as DbJson;

export const seed = async () => {
  try {
    console.log('🧹 Очищаем и пересоздаём структуру БД...');

    // 1. Удаляем все таблицы (в порядке, обратном зависимостям)
    await db.query(`
      DROP TABLE IF EXISTS cart_items, ratings, comments, favorites, products, brands, users;
    `);

    // 2. Создаём таблицы заново в правильном порядке (без кавычек, всё в snake_case)
    await db.query(`
      -- Пользователи
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        login TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
      );

      -- Бренды
      CREATE TABLE brands (
        name TEXT PRIMARY KEY
      );

      -- Товары
      CREATE TABLE products (
        id TEXT PRIMARY KEY,
        brand TEXT NOT NULL REFERENCES brands(name) ON DELETE RESTRICT,
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

      -- Избранное
      CREATE TABLE favorites (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        productId TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(userId, productId)
      );

      -- Комментарии
				CREATE TABLE comments (
				id SERIAL PRIMARY KEY,
				user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,    
				parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
				user_name TEXT NOT NULL,
				user_comment TEXT NOT NULL,
				date TEXT NOT NULL,
				product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE  
				);
				
      -- Рейтинги
      CREATE TABLE ratings (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        productId TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        UNIQUE(userId, productId)
      );

      -- Корзина
      CREATE TABLE cart_items (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        productId TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1
      );
    `);

    console.log('✅ Структура БД создана');

    // === ДАЛЬШЕ — ЗАПОЛНЕНИЕ ДАННЫМИ ===
    const allBrands = new Set(dbJson.brands.map((b) => b.trim().toLowerCase()));;

    // Вставляем бренды (без дублирования)
    for (const brand of dbJson.brands) {
      const normalizedBrand = brand.trim();
      await db.query(
        'INSERT INTO brands (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [normalizedBrand]
      );
    }

    // Вставляем пользователей
    const userInsert = `
      INSERT INTO users (login, password, email, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (login) DO NOTHING
    `;

    // Стандартные пользователи
    const johnPassword = await bcrypt.hash('qwerty', 10);
    await db.query(userInsert, ['john', johnPassword, 'john@test.com', '+7(222)222 11 00', 'user']);

    const adminPassword = await bcrypt.hash('admin123', 10);
    await db.query(userInsert, ['admin', adminPassword, 'admin@example.com', '+70000000000', 'admin']);

    // Пользователи из db.json
    for (const user of dbJson.users || []) {
      const hashed = await bcrypt.hash(user.password, 10);
      await db.query(userInsert, [
        user.login,
        hashed,
        user.email,
        user.phone,
        user.role || 'user',
      ]);
    }

    // Вставляем товары
    const productInsert = `
      INSERT INTO products (
        id, brand, category, quantity, title, description, 
        price, accum, memory, photo, rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO NOTHING
    `;

    for (const p of dbJson.products || []) {
      const brandLower = p.brand.trim().toLowerCase();
      if (!allBrands.has(brandLower)) {
        console.warn(`⚠️ Бренд "${p.brand}" не найден в списке брендов!`);
        continue;
      }

      const originalBrand = dbJson.brands.find(
        (b) => b.trim().toLowerCase() === brandLower
      ) || p.brand;

      await db.query(productInsert, [
        p.id,
        originalBrand.trim(),
        p.category.trim(),
        p.quantity || 0,
        p.title,
        p.description,
        p.price,
        p.accum || '',
        p.memory || '',
        p.photo || '',
        p.rating || 0,
      ]);
    }


  // Вставляем комментарии
for (const c of dbJson.comments || []) {
  let userId = 1;
  if (c.user_name && c.user_name !== 'false') {
    const userRes = await db.query('SELECT id FROM users WHERE login = $1', [c.user_name]);
    userId = userRes.rows[0]?.id || 1;
  }

  await db.query(
    `INSERT INTO comments (user_id, parent_id, user_name, user_comment, date, product_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      userId,
      null,
      c.user_name || 'Аноним',
      c.user_comment,
      c.date,
      c.productId, // ← из db.json может быть camelCase — это OK, т.к. это значение
    ]
  );
}


    // Вставляем корзину
    for (const item of dbJson.cart || []) {
      const cartId = randomUUID();
      await db.query(
        `INSERT INTO cart_items (id, user_id, product_id, quantity)
         VALUES ($1, $2, $3, $4)`,
        [cartId, 1, item.id, item.quantity || 1]
      );
    }

		///
    console.log('✅ Данные из db.json успешно загружены в PostgreSQL');
  } catch (err) {
    console.error('❌ Ошибка заполнения данных:', err);
    process.exit(1);
  }
};



