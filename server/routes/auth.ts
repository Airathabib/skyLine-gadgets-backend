import { Router } from 'express';
import db from '../utils/db.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const saltRounds = 10;
  const { login, password, email, phone, role } = req.body;

  if (!login || !password || !email || !phone) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    const existing = await db.query(
      'SELECT * FROM users WHERE login = $1 OR email = $2',
      [login, email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Пользователь с таким логином или email уже существует',
      });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const result = await db.query(
      `INSERT INTO users (login, password, email, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, login, email, phone, role`,
      [login, hashedPassword, email, phone, role || 'user']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

router.post('/login', async (req, res) => {
  const { login, password } = req.body;

  try {
    const userResult = await db.query('SELECT * FROM users WHERE login = $1', [
      login,
    ]);

    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const token = generateToken({
      id: user.id,
      login: user.login,
      role: user.role,
    });

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Ошибка логина:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/', (req, res) => {
  db.query('SELECT id, login, email, phone, role FROM users')
    .then((result) => {
      res.json(result.rows);
    })
    .catch((err) => {
      console.error('Ошибка загрузки пользователей:', err);
      res.status(500).json({ error: 'Ошибка загрузки пользователей' });
    });
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  const currentUserId = (req as any).user.id;

  try {
    if (Number(id) === currentUserId) {
      return res.status(403).json({ error: 'Нельзя удалить самого себя' });
    }

    const userResult = await db.query(
      'SELECT id, role FROM users WHERE id = $1',
      [id]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Нельзя удалять админа' });
    }

    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Ошибка удаления пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
