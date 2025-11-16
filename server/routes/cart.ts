import { Router, Request, Response } from 'express';
import db from '../utils/db.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const { rows } = await db.query(
      `
      SELECT 
        p.id, p.title, p.description, p.price, p.accum, p.memory, p.photo, 
   p.brand, p.category, p.rating,
        p.quantity as stock_quantity,
        c.quantity as cart_quantity
      FROM cart_items c
      JOIN products p ON c.productId = p.id
      WHERE c.userId = $1
    `,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Ошибка корзины:', err);
    res.status(500).json({ error: 'Ошибка загрузки корзины' });
  }
});

router.post('/', auth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { productId, delta } = req.body;

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'productId обязателен (строка)' });
  }
  if (delta === undefined || typeof delta !== 'number') {
    return res.status(400).json({ error: 'delta обязателен (число)' });
  }

  try {
    const productRes = await db.query(
      'SELECT id, quantity FROM products WHERE id = $1',
      [productId]
    );
    if (productRes.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    const product = productRes.rows[0];

    const currentCartItemRes = await db.query(
      'SELECT quantity FROM cart_items WHERE userId = $1 AND productId = $2',
      [userId, productId]
    );
    const currentCartQty = currentCartItemRes.rows[0]?.quantity || 0;
    const newCartQty = currentCartQty + delta;

    if (newCartQty < 0) {
      return res
        .status(400)
        .json({ error: 'Нельзя удалить больше, чем в корзине' });
    }
    if (newCartQty > product.quantity) {
      return res
        .status(400)
        .json({ error: `Недостаточно товара. Доступно: ${product.quantity}` });
    }

    if (newCartQty === 0) {
      await db.query(
        'DELETE FROM cart_items WHERE userId = $1 AND productId = $2',
        [userId, productId]
      );
    } else {
      if (currentCartItemRes.rows.length > 0) {
        await db.query(
          'UPDATE cart_items SET quantity = $1 WHERE userId = $2 AND productId = $3',
          [newCartQty, userId, productId]
        );
      } else {
        const newId = `cart_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 9)}`;
        await db.query(
          'INSERT INTO cart_items (id, userId, productId, quantity) VALUES ($1, $2, $3, $4)',
          [newId, userId, productId, newCartQty]
        );
      }
    }

    const cartItemsRes = await db.query(
      `
        SELECT 
          p.id, p.title, p.description, p.price, p.accum, p.memory, p.photo, 
          p.brand, p.category, p.rating,
          p.quantity as stock_quantity,
          c.quantity as cart_quantity
        FROM cart_items c
        JOIN products p ON c.productId = p.id
        WHERE c.userId = $1
      `,
      [userId]
    );

    res.json(cartItemsRes.rows);
  } catch (err) {
    console.error('Ошибка корзины:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/:productId', auth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { productId } = req.params;

  try {
    const existsRes = await db.query(
      'SELECT 1 FROM cart_items WHERE userId = $1 AND productId = $2',
      [userId, productId]
    );
    if (existsRes.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден в корзине' });
    }

    await db.query(
      'DELETE FROM cart_items WHERE userId = $1 AND productId = $2',
      [userId, productId]
    );

    const cartItemsRes = await db.query(
      `
        SELECT 
          p.id, p.title, p.description, p.price, p.accum, p.memory, p.photo, 
          p.brand, p.category, p.rating,
          p.quantity as stock_quantity,
          c.quantity as cart_quantity
        FROM cart_items c
        JOIN products p ON c.productId = p.id
        WHERE c.userId = $1
      `,
      [userId]
    );

    res.json(cartItemsRes.rows);
  } catch (err) {
    console.error('Ошибка удаления из корзины:', err);
    res.status(500).json({ error: 'Ошибка удаления из корзины' });
  }
});

export default router;
