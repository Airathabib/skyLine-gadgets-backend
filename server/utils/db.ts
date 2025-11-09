import Database from 'better-sqlite3';
import * as path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../db/shop.db');

const dbDir = path.dirname(dbPath);
mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);

// =============== СОЗДАНИЕ ТАБЛИЦ ===============

// Таблица товаров
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    addedToCart BOOLEAN NOT NULL DEFAULT 0,
    accum TEXT,
    memory TEXT,
    photo TEXT,
    rating REAL NOT NULL DEFAULT 0
  )
`);

// Таблица брэндов
db.exec(`
  CREATE TABLE IF NOT EXISTS brands (
    name TEXT UNIQUE NOT NULL
  )
`);

// Таблица избранных товаров
db.exec(`
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(user_id, product_id)
  )
`);

// Таблица комментариев
db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    parent_id INTEGER,
    userName TEXT NOT NULL,
    userComment TEXT NOT NULL,
    date TEXT NOT NULL,
    productId TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
  )
`);

// Таблица пользователей
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL
  )
`);

// Таблица рейтингов
db.exec(`
  CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(user_id, product_id)
  )
`);

// Таблица корзины
db.exec(`
  CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  )
`);

// =============== МИГРАЦИЯ: добавление колонки role ===============
try {
  db.prepare('SELECT role FROM users LIMIT 1').get();
} catch (e) {
  console.log('🔄 Добавляем колонку "role" в таблицу users...');
  db.exec(`ALTER TABLE users ADD COLUMN role TEXT`);
  db.exec(`UPDATE users SET role = 'user' WHERE role IS NULL`);
}

// =============== СОЗДАНИЕ ПОЛЬЗОВАТЕЛЕЙ ===============
const createAdmin = () => {
  const adminExists = db
    .prepare('SELECT 1 FROM users WHERE login = ?')
    .get('admin');
  if (!adminExists) {
    const hashed = bcrypt.hashSync('admin123', 10);
    db.prepare(
      `
      INSERT INTO users (login, password, email, phone, role)
      VALUES (?, ?, ?, ?, 'admin')
    `
    ).run('admin', hashed, 'admin@example.com', '+70000000000');
    console.log('✅ Админ создан. Логин: admin, Пароль: admin123');
  }
};

const createTestUser = () => {
  const userExists = db
    .prepare('SELECT 1 FROM users WHERE login = ?')
    .get('john');
  if (!userExists) {
    const hashed = bcrypt.hashSync('qwerty', 10);
    db.prepare(
      `
      INSERT INTO users (login, password, email, phone, role)
      VALUES (?, ?, ?, ?, 'user')
    `
    ).run('john', hashed, 'john@mail.ru', '+7 (999) 999 99 99');
    console.log('✅ Пользователь john создан');
  }
};

createAdmin();
createTestUser();

console.log('✅ База данных инициализирована');
export default db;
