import { Router } from 'express';
import db from '../utils/db.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/:productId', (req, res) => {
  const { productId } = req.params;
  try {
    const avg = db
      .prepare(
        `
      SELECT AVG(rating) as average, COUNT(*) as count
      FROM ratings
      WHERE product_id = ?
    `
      )
      .get(productId);

    let userRating = null;
    if (req.headers.authorization) {
      const userId = (req as any).user?.id;
      if (userId) {
        const userRate = db
          .prepare('SELECT rating FROM ratings WHERE user_id = ? AND product_id = ?')
          .get(userId, productId);
        userRating = userRate?.rating || null;
      }
    }

    res.json({
      average: avg.average ? parseFloat(avg.average.toFixed(1)) : 0,
      count: avg.count || 0,
      userRating,
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки рейтинга' });
  }
});

router.post('/', auth, (req, res) => {
  const userId = (req as any).user.id;
  const { productId, rating } = req.body;

  if (!productId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Неверные данные' });
  }

  try {
    db.prepare(
      `
      INSERT INTO ratings (user_id, product_id, rating)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, product_id) DO UPDATE SET rating = excluded.rating
    `
    ).run(userId, productId, rating);

    const avg = db
      .prepare('SELECT AVG(rating) as average FROM ratings WHERE product_id = ?')
      .get(productId);
    res.json({ average: parseFloat(avg.average.toFixed(1)) });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сохранения рейтинга' });
  }
});

export default router;
