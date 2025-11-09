import { Router } from 'express';
import db from '../utils/db.js';
import { auth } from '../middleware/auth.js';
import { CartItem, Product } from '../models/Product.js';

const router = Router();

// GET /api/cart
router.get('/', auth, (req, res) => {
  const userId = (req as any).user.id;
  try {
    const cartItems = db
      .prepare(
        `
      SELECT 
        p.id, p.title, p.description, p.price, p.accum, p.memory, p.photo, 
     		 p.brand, p.category, p.rating,
        p.quantity as stockQuantity,
        c.quantity as cartQuantity
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `
      )
      .all(userId);
    res.json(cartItems);
  } catch (err) {
    console.error('Ошибка загрузки корзины:', err);
    res.status(500).json({ error: 'Ошибка загрузки корзины' });
  }
});

// POST /api/cart — управление количеством
router.post('/', auth, (req, res) => {
  const userId = (req as any).user.id;
  const { productId, delta } = req.body;

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'productId обязателен (строка)' });
  }
  if (delta === undefined || typeof delta !== 'number') {
    return res.status(400).json({ error: 'delta обязателен (число)' });
  }

  try {
    // Проверка существования товара
    const product = db
      .prepare('SELECT id FROM products WHERE id = ?')
      .get(productId) as Product | undefined;
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    // Текущее количество в корзине
    const currentCartItem = db
      .prepare(
        'SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?'
      )
      .get(userId, productId) as CartItem | undefined;
    const currentCartQty = currentCartItem ? currentCartItem.quantity : 0;
    const newCartQty = currentCartQty + delta;

    // Валидация
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

    // Обновление корзины
    if (newCartQty === 0) {
      db.prepare(
        'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?'
      ).run(userId, productId);
    } else {
      if (currentCartItem) {
        db.prepare(
          'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?'
        ).run(newCartQty, userId, productId);
      } else {
        const newId = `cart_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 9)}`;
        db.prepare(
          'INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)'
        ).run(newId, userId, productId, newCartQty);
      }
    }

    // Возвращаем корзину
    const cartItems = db
      .prepare(
        `
      SELECT 
        p.id, p.title, p.description, p.price, p.accum, p.memory, p.photo, 
        p.brand, p.category, p.rating,
        p.quantity as stockQuantity,
        c.quantity as cartQuantity
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `
      )
      .all(userId);

    res.json(cartItems);
  } catch (err) {
    console.error('Ошибка корзины:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/cart/:productId — полное удаление товара из корзины
router.delete('/:productId', auth, (req, res) => {
  const userId = (req as any).user.id;
  const { productId } = req.params;

  try {
    // Проверяем, есть ли товар в корзине
    const exists = db
      .prepare('SELECT 1 FROM cart_items WHERE user_id = ? AND product_id = ?')
      .get(userId, productId);
    if (!exists) {
      return res.status(404).json({ error: 'Товар не найден в корзине' });
    }

    // Удаляем
    db.prepare(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?'
    ).run(userId, productId);

    // Возвращаем обновлённую корзину
    const cartItems = db
      .prepare(
        `
      SELECT 
        p.id, p.title, p.description, p.price, p.accum, p.memory, p.photo, 
      	p.brand, p.category, p.rating,
        p.quantity as stockQuantity,
        c.quantity as cartQuantity
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `
      )
      .all(userId);

    res.json(cartItems);
  } catch (err) {
    console.error('Ошибка удаления из корзины:', err);
    res.status(500).json({ error: 'Ошибка удаления из корзины' });
  }
});

export default router;
