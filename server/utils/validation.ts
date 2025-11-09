// server/utils/validation.ts
import { ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validateBody = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Защита от не-объектов
      if (!req.body || typeof req.body !== 'object') {
        return res
          .status(400)
          .json({ error: 'Тело запроса должно быть JSON-объектом' });
      }
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      // Только если это ZodError — обрабатываем детали
      if (error instanceof ZodError && Array.isArray(error.errors)) {
        const errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        return res
          .status(400)
          .json({ error: 'Ошибка валидации', details: errors });
      }

      // Любая другая ошибка — логируем и возвращаем 500
      console.error('Ошибка валидации (не Zod):', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  };
};

export const validateQuery = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        res.status(400).json({
          error: 'Ошибка валидации параметров',
          details: errors,
        });
      } else {
        res.status(500).json({ error: 'Внутренняя ошибка' });
      }
    }
  };
};
