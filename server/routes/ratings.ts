import { Router } from 'express';
import db from '../utils/db.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const avgResult = await db.query(
      `SELECT AVG(rating) as average, COUNT(*) as count
       FROM ratings
       WHERE productId = $1`,
      [productId]
    );

    let userRating = null;
    if (req.headers.authorization) {
      const userId = (req as any).user?.id;
      if (userId) {
        const userResult = await db.query(
          `SELECT rating FROM ratings 
           WHERE userId = $1 AND productId = $2`,
          [userId, productId]
        );
        userRating = userResult.rows[0]?.rating || null;
      }
    }

    const avg = avgResult.rows[0];
    const rawAverage = avg?.average;
    const numericAverage = rawAverage ? parseFloat(rawAverage) : 0;

    res.json({
      average: parseFloat(numericAverage.toFixed(1)),
      count: parseInt(avg?.count) || 0,
      userRating,
    });
  } catch (err) {
    console.error('Ошибка загрузки рейтинга:', err);
    res.status(500).json({ error: 'Ошибка загрузки рейтинга' });
  }
});

router.post('/', auth, async (req, res) => {
  const userId = (req as any).user.id;
  const { productId, rating } = req.body;

  if (!productId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Неверные данные' });
  }

  try {
    await db.query(
      `INSERT INTO ratings (userId, productId, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (userId, productId) 
       DO UPDATE SET rating = EXCLUDED.rating`,
      [userId, productId, rating]
    );

    const avgResult = await db.query(
      `SELECT AVG(rating) as average 
       FROM ratings 
       WHERE productId = $1`,
      [productId]
    );

    const average = avgResult.rows[0]?.average;
    const numericAverage = average ? parseFloat(average) : 0;
    const averageValue = parseFloat(numericAverage.toFixed(1));

    res.json({ average: averageValue });
  } catch (err) {
    console.error('Ошибка сохранения рейтинга:', err);
    res.status(500).json({ error: 'Ошибка сохранения рейтинга' });
  }
});

export default router;
