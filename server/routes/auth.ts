// server/routes/auth.ts
import { Router } from 'express';
import db from '../utils/db.js';
import { validateBody } from '../utils/validation.js';
import { userSchema } from '../schemas/userSchema.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const saltRounds = 10;
  const { login, password, email, phone, role } = req.body;

  if (!login || !password || !email || !phone) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    const existing = db
      .prepare('SELECT * FROM users WHERE login = ? OR email = ?')
      .get(login, email);
    if (existing) {
      return res
        .status(409)
        .json({
          error: 'Пользователь с таким логином или email уже существует',
        });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const stmt = db.prepare(`
      INSERT INTO users (login, password, email, phone, role )
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(login, hashedPassword, email, phone, role || 'user');

    // 🔥 Возвращаем созданного пользователя (без пароля!)
    const newUser = db
      .prepare(
        'SELECT id, login, email, phone, role FROM users WHERE login = ?'
      )
      .get(login);
    res.status(201).json(newUser); // ← теперь возвращаем объект
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  try {
    const user = db
      .prepare('SELECT * FROM users WHERE login = ?')
      .get(login) as User | undefined;
    if (!user)
      return res.status(401).json({ error: 'Неверный логин или пароль' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: 'Неверный логин или пароль' });

    // Генерируем токен с ролью
    const token = generateToken({
      id: user.id,
      login: user.login,
      role: user.role,
    });

    // Возвращаем данные БЕЗ пароля
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/users — для получения списка пользователей (без паролей)
router.get('/', (req, res) => {
  try {
    const users = db
      .prepare('SELECT id, login, email, phone, role FROM users')
      .all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки пользователей' });
  }
});

// server/routes/auth.ts
router.delete('/:id', auth, adminOnly, (req, res) => {
  const { id } = req.params;
  try {
    // Нельзя удалить самого себя
    const currentUserId = (req as any).user.id;
    if (Number(id) === currentUserId) {
      return res.status(403).json({ error: 'Нельзя удалить самого себя' });
    }

    const user = db
      .prepare('SELECT id, role FROM users WHERE id = ?')
      .get(id) as User | undefined;
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    if (user.role === 'admin')
      return res.status(403).json({ error: 'Нельзя удалять админа' });

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.status(204).send();
  } catch (err) {
    console.error('Ошибка удаления пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
