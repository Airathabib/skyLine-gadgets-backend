import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import productsRouter from './routes/products.js';
import commentsRouter from './routes/comments.js';
import authRouter from './routes/auth.js';
import cartRouter from './routes/cart.js';
import favoritesRouter from './routes/favorites.js';
import ratingsRouter from './routes/ratings.js';
import brandsRouter from './routes/brands.js';

import db from './utils/db.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', authRouter);
app.use('/api/cart', cartRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/brands', brandsRouter);

app.get('/api/brands', (req, res) => {
  try {
    const brands = db.prepare('SELECT DISTINCT brand FROM products').all();
    res.json(brands.map((row: any) => row.brand));
  } catch (err) {
    console.error('Ошибка загрузки брендов:', err);
    res.status(500).json({ error: 'Ошибка загрузки брендов' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

app.listen(PORT, () => {
  console.log(`🚀 Бэкенд запущен на http://localhost:${PORT}`);
});
