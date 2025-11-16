import { ZodError, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: any;
    }
  }
}

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // У ZodError есть свойство issues, а не errors!
        const errors = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        return res
          .status(400)
          .json({ error: 'Ошибка валидации', details: errors });
      }
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      req.validatedQuery = parsed; 
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        return res.status(400).json({
          error: 'Ошибка валидации параметров',
          details: errors,
        });
      }
      return res.status(500).json({ error: 'Внутренняя ошибка' });
    }
  };
};
