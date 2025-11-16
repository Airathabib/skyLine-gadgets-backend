import { Router } from 'express';
import db from '../utils/db.js';
import { validateBody } from '../utils/validation.js';
import {
  createProductSchema,
  updateProductSchema,
} from '../schemas/productSchema.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = Router();

const transformProduct = (product: any) => {
  return {
    ...product,
    quantity: Number(product.quantity),
    price: Number(product.price),
    rating: Number(product.rating),
  };
};

const buildWhereClause = (query: any) => {
  const { q, category, price_gte, price_lte } = query;
  const conditions: string[] = [];
  const params: any[] = [];
  let index = 1;

  if (q) {
    conditions.push(`(title ILIKE $${index} OR description ILIKE $${index})`);
    params.push(`%${q}%`);
    index++;
  }

  if (category) {
    conditions.push(`category = $${index}`);
    params.push(category);
    index++;
  }

  if (price_gte != null) {
    conditions.push(`price >= $${index}`);
    params.push(Number(price_gte));
    index++;
  }

  if (price_lte != null) {
    conditions.push(`price <= $${index}`);
    params.push(Number(price_lte));
    index++;
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';
  return { whereClause, params };
};

router.get('/', async (req, res) => {
  try {
    const { whereClause, params } = buildWhereClause(req.query);
    let sql = `SELECT id, brand, category, title, description, price, 
                      accum, memory, photo, rating, quantity 
               FROM products ${whereClause}`;

    const { _sort, _order } = req.query;
    if (_sort === 'price' && (_order === 'asc' || _order === 'desc')) {
      sql += ` ORDER BY price ${_order.toUpperCase()}`;
    }

    const { rows } = await db.query(sql, params);
    res.json(rows.map(transformProduct));
  } catch (err) {
    console.error('Ошибка загрузки товаров:', err);
    res.status(500).json({ error: 'Ошибка при загрузке товаров' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, brand, category, title, description, price,
              accum, memory, photo, rating, quantity
       FROM products WHERE id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    res.json(transformProduct(rows[0]));
  } catch (err) {
    console.error('Ошибка получения товара:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.post(
  '/',
  auth,
  adminOnly,
  validateBody(createProductSchema),
  async (req, res) => {
    const {
      id,
      brand,
      category,
      quantity,
      title,
      description,
      price,
      accum,
      memory,
      photo,
      rating = 0,
    } = req.body;

    try {
      const { rows } = await db.query(
        `INSERT INTO products (
        id, brand, category, quantity, title, description, price,
        accum, memory, photo, rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
        [
          id,
          brand,
          category,
          quantity,
          title,
          description,
          price,
          accum,
          memory,
          photo.trim() || '',
          rating,
        ]
      );

      res.status(201).json(transformProduct(rows[0]));
    } catch (err) {
      console.error('Ошибка создания товара:', err);
      res.status(500).json({ error: 'Ошибка при создании товара' });
    }
  }
);

router.put(
  '/:id',
  auth,
  adminOnly,
  validateBody(updateProductSchema),
  async (req, res) => {
    const { id } = req.params;
    const {
      brand,
      category,
      quantity,
      title,
      description,
      price,
      accum,
      memory,
      photo,
      rating,
    } = req.body;

    try {
      const { rowCount } = await db.query(
        'SELECT 1 FROM products WHERE id = $1',
        [id]
      );
      if (rowCount === 0) {
        return res.status(404).json({ error: 'Товар не найден' });
      }

      const { rows } = await db.query(
        `UPDATE products SET
        brand = $1, category = $2, quantity = $3, title = $4,
        description = $5, price = $6, accum = $7, memory = $8,
        photo = $9, rating = $10
       WHERE id = $11
       RETURNING *`,
        [
          brand,
          category,
          quantity,
          title,
          description,
          price,
          accum,
          memory,
          photo?.trim() || '',
          rating,
          id,
        ]
      );

      res.json(transformProduct(rows[0]));
    } catch (err) {
      console.error('Ошибка обновления товара:', err);
      res.status(500).json({ error: 'Ошибка при обновлении товара' });
    }
  }
);

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM products WHERE id = $1', [
      req.params.id,
    ]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Ошибка удаления товара:', err);
    res.status(500).json({ error: 'Ошибка при удалении товара' });
  }
});

export default router;
