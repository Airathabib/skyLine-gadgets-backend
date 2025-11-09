// server/routes/products.ts
import { Router } from 'express';
import { Request, Response } from 'express';
import db from '../utils/db.js';
import { validateBody } from '../utils/validation.js';
import {
  createProductSchema,
  toggleLikeSchema,
  updateProductSchema,
} from '../schemas/productSchema.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = Router();

const transformProduct = (product: any) => {
  return {
    ...product,
    addedToCart: Boolean(product.addedToCart),
  };
};

// Вспомогательная функция для SELECT-запроса
const selectProductFields = `
  id, brand, category, title, description, price, addedToCart, accum, memory, photo, rating,
  quantity as stockQuantity
`;

// GET /api/products с поддержкой фильтрации
router.get('/', (req, res) => {
  try {
    const { q, category, _sort, _order, price_gte, price_lte } = req.query;

    let sql = `SELECT ${selectProductFields} FROM products WHERE 1 = 1`;
    const params: any[] = [];

    // Фильтр по категории
    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    // Фильтр по цене
    if (price_gte) {
      sql += ` AND price >= ?`;
      params.push(Number(price_gte));
    }
    if (price_lte) {
      sql += ` AND price <= ?`;
      params.push(Number(price_lte));
    }

    // Сортировка
    if (_sort === 'price' && (_order === 'asc' || _order === 'desc')) {
      sql += ` ORDER BY price ${_order.toUpperCase()}`;
    }

    const stmt = db.prepare(sql);
    const products = stmt.all(...params);
    res.json(products.map(transformProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при загрузке товаров' });
  }
});

// GET /api/products/:id
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const product = db.prepare(`SELECT ${selectProductFields} FROM products WHERE id = ?`).get(id);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    res.json(transformProduct(product));
  } catch (err) {
    console.error('Ошибка при получении товара:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/products
router.post('/', auth, adminOnly, validateBody(createProductSchema), (req, res) => {
  const {
    id,
    brand,
    category,
    quantity,
    title,
    description,
    price,
    addedToCart = false,
    accum,
    memory,
    photo,
    rating = 0,
  } = req.body;

  if (!id || !title || price == null) {
    return res.status(400).json({ error: 'Обязательные поля: id, title, price' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO products (id, brand, category, quantity, title, description, price,  addedToCart, accum, memory, photo, rating)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      brand,
      category,
      quantity,
      title,
      description,
      price,
      addedToCart ? 1 : 0,
      accum,
      memory,
      photo.trim(),
      rating
    );
    res.status(201).json({
      id,
      brand,
      category,
      quantity,
      title,
      description,
      price,
      addedToCart,
      accum,
      memory,
      photo,
      rating,
    });
  } catch (err) {
    console.error('Ошибка создания товара:', err); // ← добавь это
    res.status(500).json({ error: 'Ошибка при создании товара' });
  }
});

// PUT /api/products/:id
router.put('/:id', auth, adminOnly, validateBody(updateProductSchema), async (req, res) => {
  const { id } = req.params;
  const {
    brand,
    category,
    quantity,
    title,
    description,
    price,
    addedToCart,
    accum,
    memory,
    photo,
    rating,
  } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Товар не найден' });

    const stmt = db.prepare(`
      UPDATE products
      SET brand = ?, category = ?, quantity = ?, title = ?, description = ?, price = ?, addedToCart = ?, accum = ?, memory = ?, photo = ?, rating = ?
      WHERE id = ?
    `);
    stmt.run(
      brand,
      category,
      quantity,
      title,
      description,
      price,
      addedToCart,
      accum,
      memory,
      photo,
      rating,
      id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при обновлении товара' });
  }
});

// PATCH /api/products/:id
router.patch('/:id', validateBody(toggleLikeSchema), async (req, res) => {
  const { id } = req.params;

  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Товар не найден' });

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json(transformProduct(updated));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления like' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Товар не найден' });

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.status(204).send();
    return; // ← явно завершаем
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при удалении товара' });
    return;
  }
});

export default router;
