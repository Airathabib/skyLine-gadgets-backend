// server/routes/comments.ts
import { Router } from 'express';
import db from '../utils/db.js';
import { validateBody } from '../utils/validation.js';
import {
  commentSchema,
  updateCommentSchema,
} from '../schemas/commentSchema.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const { productId } = req.query; // camelCase из URL

  if (!productId) {
    return res.status(400).json({ error: 'productId обязателен' });
  }

  try {
    const { rows } = await db.query(
      `SELECT id, user_id, parent_id, user_name, user_comment, date, product_id
       FROM comments 
       WHERE product_id = $1 
       ORDER BY date DESC`,
      [productId]
    );

    const commentsCamel = rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      parentId: row.parent_id,
      userName: row.user_name,
      userComment: row.user_comment,
      date: row.date,
      productId: row.product_id,
    }));

    const map: Record<number, any> = {};
    commentsCamel.forEach((c) => {
      map[c.id] = { ...c, replies: [] };
    });

    const roots: any[] = [];
    commentsCamel.forEach((c) => {
      if (c.parentId === null) {
        roots.push(map[c.id]);
      } else {
        const parent = map[c.parentId];
        if (parent) parent.replies.push(map[c.id]);
      }
    });

    res.json(roots);
  } catch (err) {
    console.error('Ошибка загрузки:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/', auth, validateBody(commentSchema), async (req, res) => {
  const userId = (req as any).user.id;
  const { userName, userComment, productId, parentId } = req.body; // camelCase

  try {
    const date = new Date().toISOString();
    const { rows } = await db.query(
      `INSERT INTO comments (user_id, parent_id, user_name, user_comment, date, product_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, parent_id, user_name, user_comment, date, product_id`,
      [userId, parentId || null, userName, userComment, date, productId]
    );

    const saved = rows[0];
    res.status(201).json({
      id: saved.id,
      userId: saved.user_id,
      parentId: saved.parent_id,
      userName: saved.user_name,
      userComment: saved.user_comment,
      date: saved.date,
      productId: saved.product_id,
    });
  } catch (err) {
    console.error('Ошибка создания:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.patch(
  '/:id',
  auth,
  validateBody(updateCommentSchema),
  async (req, res) => {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { userComment } = req.body; // camelCase

    try {
      const { rows: commentRows } = await db.query(
        'SELECT id, user_id FROM comments WHERE id = $1',
        [id]
      );

      if (!commentRows.length) {
        return res.status(404).json({ error: 'Не найден' });
      }
      if (commentRows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Нет прав' });
      }

      const newDate = new Date().toISOString();
      const { rows } = await db.query(
        'UPDATE comments SET user_comment = $1, date = $2 WHERE id = $3 RETURNING *',
        [userComment, newDate, id]
      );

      const updated = rows[0];
      res.json({
        id: updated.id,
        userId: updated.user_id,
        parentId: updated.parent_id,
        userName: updated.user_name,
        userComment: updated.user_comment,
        date: updated.date,
        productId: updated.product_id,
      });
    } catch (err) {
      console.error('Ошибка обновления:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

router.delete('/:id', auth, async (req, res) => {
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Не найден' });

    const comment = rows[0];
    if (comment.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Нет прав' });
    }

    await db.query('DELETE FROM comments WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Ошибка удаления:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
export default router;
