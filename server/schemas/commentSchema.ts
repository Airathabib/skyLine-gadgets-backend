// server/schemas/commentSchema.ts
import { z } from 'zod';

export const commentSchema = z.object({
  userName: z.string().min(1, 'Имя обязательно'),
  userComment: z.string().min(1, 'Комментарий обязателен'),
  date: z.string(),
  productId: z.string().min(1, 'ID товара обязателен'),
  parent_id: z.number().int().positive().optional(),
});

// Схема только для редактирования
export const updateCommentSchema = z.object({
  userComment: z.string().min(1, 'Комментарий обязателен'),
});
