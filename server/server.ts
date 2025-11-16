import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import db from './utils/db.js';

// Роутеры
import productsRouter from './routes/products.js';
import commentsRouter from './routes/comments.js';
import authRouter from './routes/auth.js';
import cartRouter from './routes/cart.js';
import favoritesRouter from './routes/favorites.js';
import ratingsRouter from './routes/ratings.js';
import brandsRouter from './routes/brands.js';
import { seed } from './seeds/seed.js';

const startServer = async () => {
  // В dev-режиме: всегда пересоздаём БД из seed
  // await seed();  ← пересоздаёт таблицы и вставляет данные

  const app = express();

  // Middleware
  app.use(cors());
  app.use(helmet());
  app.use(morgan('dev'));
  app.use(express.json());

  // Роутеры
  app.use('/api/products', productsRouter);
  app.use('/api/comments', commentsRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/users', authRouter); // ← возможно, избыточно, но допустимо
  app.use('/api/cart', cartRouter);
  app.use('/api/favorites', favoritesRouter);
  app.use('/api/ratings', ratingsRouter);
  app.use('/api/brands', brandsRouter); // ✅ только этот роут для брендов

  app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
  });

  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Бэкенд запущен на http://localhost:${PORT}`);
  });
};

startServer().catch(console.error);
