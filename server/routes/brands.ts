// server/routes/brands.ts
import { Router } from 'express';
import db from '../utils/db.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT name FROM brands ORDER BY name');
    res.json(rows.map((b: any) => b.name));
  } catch (err) {
    console.error('Ошибка загрузки брендов:', err);
    res.status(500).json({ error: 'Ошибка загрузки брендов' });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Имя бренда обязательно' });

  try {
    await db.query('INSERT INTO brands (name) VALUES ($1)', [name]);
    res.status(201).json({ name });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Бренд уже существует' });
    }
    console.error('Ошибка добавления бренда:', err);
    res.status(500).json({ error: 'Ошибка добавления бренда' });
  }
});

router.delete('/:name', auth, adminOnly, async (req, res) => {
  const { name } = req.params;

  try {
    const countResult = await db.query(
      'SELECT COUNT(*) as cnt FROM products WHERE brand = $1',
      [name]
    );

    const count = parseInt(countResult.rows[0].cnt);
    if (count > 0) {
      return res
        .status(400)
        .json({ error: 'Нельзя удалить бренд, пока есть товары' });
    }

    await db.query('DELETE FROM brands WHERE name = $1', [name]);
    res.status(204).send();
  } catch (err) {
    console.error('Ошибка удаления бренда:', err);
    res.status(500).json({ error: 'Ошибка удаления бренда' });
  }
});

export default router;
