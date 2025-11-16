import { Router } from 'express';
import { seed } from '../seeds/seed.js';

const router = Router();

// Защита: только при наличии секретного ключа
router.post('/reset-data', async (req, res) => {
  const secret = req.headers['x-reset-secret'];
  if (secret !== process.env.RESET_SECRET) {
    return res.status(403).json({ error: 'Запрещено' });
  }

  try {
    await seed();
    res.json({ success: true, message: 'БД успешно сброшена' });
  } catch (err) {
    console.error('Ошибка сброса:', err);
    res.status(500).json({ error: 'Ошибка сброса данных' });
  }
});

export default router;
