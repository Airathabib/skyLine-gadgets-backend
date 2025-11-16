import { Router } from 'express';
import db from '../utils/db.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const { rows: favorites } = await db.query(
      `
      SELECT 
        p.id, p.brand, p.category, p.title, p.description, p.price,
        p.accum, p.memory, p.photo, p.rating,
        p.quantity
      FROM favorites f
      LEFT JOIN products p ON f.productId = p.id
      WHERE f.userId = $1 AND p.id IS NOT NULL
      `,
      [userId]
    );
    res.json(favorites);
  } catch (err) {
    console.error('Ошибка избранного:', err);
    res.status(500).json({ error: 'Ошибка загрузки избранного' });
  }
});

router.post('/', auth, async (req, res) => {
  const userId = (req as any).user.id;
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'productId обязателен' });
  }

  try {
    const productRes = await db.query('SELECT id FROM products WHERE id = $1', [
      productId,
    ]);
    if (productRes.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    await db.query(
      'INSERT INTO favorites (userId, productId) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, productId]
    );

    res.status(201).json({ message: 'Добавлено в избранное' });
  } catch (err) {
    console.error('Ошибка добавления в избранное:', err);
    res.status(500).json({ error: 'Ошибка добавления в избранное' });
  }
});

router.delete('/:productId', auth, async (req, res) => {
  const userId = (req as any).user.id;
  const { productId } = req.params;

  try {
    await db.query(
      'DELETE FROM favorites WHERE userId = $1 AND productId = $2',
      [userId, productId]
    );
    res.status(204).send();
  } catch (err) {
    console.error('Ошибка удаления из избранного:', err);
    res.status(500).json({ error: 'Ошибка удаления из избранного' });
  }
});

export default router;
