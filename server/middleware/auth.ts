// server/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Неверный или просроченный токен' });
  }
  (req as any).user = payload;
  next();
};

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  next();
};
