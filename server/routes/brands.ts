// server/routes/brands.ts
import { Router } from 'express';
import db from '../utils/db.js';
import { Brand, BrandCountResult } from '../models/Product.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = Router();

// GET /api/brands — публичный
router.get('/', (req, res) => {
  try {
    const brands = db.prepare('SELECT name FROM brands').all() as Brand[];
    res.json(brands.map((b) => b.name));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки брендов' });
  }
});

// POST /api/brands — только для админа
router.post('/', auth, adminOnly, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Имя бренда обязательно' });

  try {
    db.prepare('INSERT INTO brands (name) VALUES (?)').run(name);
    res.status(201).json({ name });
  } catch (err) {
    if ((err as any).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Бренд уже существует' });
    }
    res.status(500).json({ error: 'Ошибка добавления бренда' });
  }
});

// DELETE /api/brands/:name — только для админа
router.delete('/:name', auth, adminOnly, (req, res) => {
  const { name } = req.params;

  try {
    // Явно типизируем результат
    const countResult = db
      .prepare('SELECT COUNT(*) as cnt FROM products WHERE brand = ?')
      .get(name) as { cnt: number };

    if (countResult.cnt > 0) {
      return res
        .status(400)
        .json({ error: 'Нельзя удалить бренд, пока есть товары' });
    }

    db.prepare('DELETE FROM brands WHERE name = ?').run(name);
    res.status(204).send();
  } catch (err) {
    console.error('Ошибка удаления бренда:', err);
    res.status(500).json({ error: 'Ошибка удаления бренда' });
  }
});

export default router;
