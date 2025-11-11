import { Router } from 'express';
import db from '../utils/db.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// GET /api/favorites — получить избранное текущего пользователя
router.get('/', auth, (req, res) => {
  const userId = (req as any).user.id;
  try {
    const favorites = db
      .prepare(
        `
    SELECT 
      p.id, p.brand, p.category, p.title, p.description, p.price,
      p.accum, p.memory, p.photo, p.rating,
      p.quantity as stockQuantity
    FROM favorites f
    LEFT JOIN products p ON f.product_id = p.id
    WHERE f.user_id = ? AND p.id IS NOT NULL
  `
      )
      .all(userId);
    res.json(favorites);
  } catch (err) {
    console.error('Ошибка избранного:', err);
    res.status(500).json({ error: 'Ошибка загрузки избранного' });
  }
});

// POST /api/favorites — добавить в избранное
router.post('/', auth, (req, res) => {
  const userId = (req as any).user.id;
  const { productId } = req.body;

  if (!productId)
    return res.status(400).json({ error: 'productId обязателен' });

  try {
    const product = db
      .prepare('SELECT id FROM products WHERE id = ?')
      .get(productId);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });

    db.prepare(
      'INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)'
    ).run(userId, productId);

    res.status(201).json({ message: 'Добавлено в избранное' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка добавления в избранное' });
  }
});

router.delete('/:productId', auth, (req, res) => {
  const userId = (req as any).user.id;
  const { productId } = req.params;

  try {
    db.prepare(
      'DELETE FROM favorites WHERE user_id = ? AND product_id = ?'
    ).run(userId, productId);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления из избранного' });
  }
});

export default router;
