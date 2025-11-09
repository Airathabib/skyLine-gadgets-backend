// // server/scripts/migrateFromJson.ts
// import Database from 'better-sqlite3';
// import * as path from 'path';
// import { fileURLToPath } from 'url';
// import bcrypt from 'bcrypt';
// import dbJson from '../../db.json' ;

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const dbPath = path.resolve(__dirname, '../../db/shop.db');

// const db = new Database(dbPath);

// console.log('🔄 Начинаем миграцию из db.json...');

// // === 1. Миграция товаров ===
// if (Array.isArray(dbJson.products) && dbJson.products.length > 0) {
//   const insertProduct = db.prepare(`
//     INSERT OR IGNORE INTO products (
//       id, brand, category, quantity, title, description, price, addedToCart, accum, memory, photo, rating
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `);

//   let count = 0;
//   for (const p of dbJson.products) {
//     try {
      
//       insertProduct.run(
//         String(p.id), 
//         p.brand,
//         p.category,
//         p.quantity || 1,
//         p.title,
//         p.description,
//         Number(p.price),
//         p.addedToCart ? 1 : 0,
//         p.accum || '',
//         p.memory || '',
//         p.photo || '',
//         Number(p.rating) || 0
//       );
//       count++;
//     } catch (e) {
//       console.warn(`⚠️ Не удалось добавить товар ${p.id}:`, e);
//     }
//   }
//   console.log(`✅ Мигрировано ${count} товаров`);
// }

// // === 2. Миграция пользователей (с хэшированием паролей) ===
// if (Array.isArray(dbJson.users) && dbJson.users.length > 0) {
//   const insertUser = db.prepare(`
//     INSERT OR IGNORE INTO users (login, password, email, phone, role)
//     VALUES (?, ?, ?, ?, ?)
//   `);

//   let count = 0;
//   for (const u of dbJson.users) {
//     try {
//       const hashed = bcrypt.hashSync(u.password, 10);
//       insertUser.run(
//         u.login,
//         hashed,
//         u.email,
//         u.phone,
//         u.role || 'user' // если нет role — ставим 'user'
//       );
//       count++;
//     } catch (e) {
//       console.warn(`⚠️ Не удалось добавить пользователя ${u.login}:`, e);
//     }
//   }
//   console.log(`✅ Мигрировано ${count} пользователей`);
// }

// // === 3. Миграция комментариев ===
// if (Array.isArray(dbJson.comments) && dbJson.comments.length > 0) {
//   const insertComment = db.prepare(`
//     INSERT OR IGNORE INTO comments (userName, userComment, date, productId)
//     VALUES (?, ?, ?, ?)
//   `);

//   let count = 0;
//   for (const c of dbJson.comments) {
//     try {
//       insertComment.run(String(c.userName || 'Аноним'), c.userComment, c.date, c.productId);
//       count++;
//     } catch (e) {
//       console.warn(`⚠️ Не удалось добавить комментарий ${c.id}:`, e);
//     }
//   }
//   console.log(`✅ Мигрировано ${count} комментариев`);
// }

// // server/scripts/migrateFromJson.ts

// // === 4. Миграция брендов ===
// if (Array.isArray(dbJson.brands) && dbJson.brands.length > 0) {
//   const insertBrand = db.prepare(`INSERT OR IGNORE INTO brands (name) VALUES (?)`);
//   let count = 0;
//   for (const brand of dbJson.brands) {
//     try {
//       insertBrand.run(brand);
//       count++;
//     } catch (e) {
//       console.warn(`⚠️ Не удалось добавить бренд ${brand}:`, e);
//     }
//   }
//   console.log(`✅ Мигрировано ${count} брендов`);
// }

// console.log('🎉 Миграция завершена!');
// db.close();
