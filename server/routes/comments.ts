// server/routes/comments.ts
import { Router } from 'express';
import db from '../utils/db.js';
import { validateBody } from '../utils/validation.js';
import {
  commentSchema,
  updateCommentSchema,
} from '../schemas/commentSchema.js';
import { Comment } from '../models/Comment.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// server/routes/comments.ts
router.get('/', (req, res) => {
  const { productId } = req.query;
  try {
    const comments = db
      .prepare('SELECT * FROM comments WHERE productId = ? ORDER BY date DESC')
      .all(productId) as Comment[];

    // Создаём типизированный маппинг
    const commentMap: Record<number, Comment> = {};
    comments.forEach((comment) => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    const rootComments: Comment[] = [];
    comments.forEach((comment) => {
      if (comment.parent_id === null) {
        rootComments.push(commentMap[comment.id]);
      } else {
        const parent = commentMap[comment.parent_id];
        if (parent && parent.replies) {
          parent.replies.push(commentMap[comment.id]);
        }
      }
    });

    res.json(rootComments);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки' });
  }
});

// POST /api/comments — добавление (требует авторизации)
router.post('/', auth, validateBody(commentSchema), (req, res) => {
  const userId = (req as any).user.id;
  const { userName, userComment, productId, parent_id } = req.body;

  try {
    const date = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO comments (user_id, parent_id, userName, userComment, date, productId)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      userId,
      parent_id || null,
      userName,
      userComment,
      date,
      productId
    );
    const newComment = db
      .prepare('SELECT * FROM comments WHERE id = ?')
      .get(info.lastInsertRowid);
    res.status(201).json(newComment);
  } catch (err) {
    console.error('Ошибка добавления комментария:', err);
    res.status(500).json({ error: 'Ошибка добавления комментария' });
  }
});

// PATCH /api/comments/:id — редактирование (только автор)
router.patch('/:id', auth, validateBody(updateCommentSchema), (req, res) => {
  const userId = (req as any).user.id;
  const { id } = req.params;
  const { userComment } = req.body;

  try {
    // 1. Проверяем, существует ли комментарий
    const comment = db
      .prepare('SELECT id, user_id FROM comments WHERE id = ?')
      .get(id) as Comment | undefined;

    if (!comment) {
      return res.status(404).json({ error: 'Комментарий не найден' });
    }

    // 2. Проверяем, является ли пользователь автором
    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'Нет прав на редактирование' });
    }

    // 3. Обновляем комментарий
    const newDate = new Date().toISOString();
    db.prepare(
      'UPDATE comments SET userComment = ?, date = ? WHERE id = ?'
    ).run(userComment, newDate, id);

    // 4. Возвращаем обновлённый комментарий
    const updatedComment = db
      .prepare('SELECT * FROM comments WHERE id = ?')
      .get(id);

    res.json(updatedComment);
  } catch (err) {
    console.error('Ошибка редактирования комментария:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/comments/:id — удаление (автор или админ)
router.delete('/:id', auth, (req, res) => {
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;
  const { id } = req.params;

  try {
    const comment = db
      .prepare('SELECT user_id FROM comments WHERE id = ?')
      .get(id) as Comment | undefined;
    if (!comment)
      return res.status(404).json({ error: 'Комментарий не найден' });
    if (comment.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Нет прав на удаление' });
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

export default router;
