import { z } from 'zod';

const baseProductSchema = z.object({
  brand: z.string().min(1, 'Бренд обязателен'),
  category: z.string().min(1, 'Категория обязательна'),
  quantity: z.number().int().min(0, 'Количество не может быть отрицательным'),
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().min(1, 'Описание обязательно'),
  price: z.number().positive('Цена должна быть положительной'),
  accum: z.string().optional(),
  memory: z.string().optional(),
  photo: z.string().optional().or(z.literal('')),
  rating: z.number().min(0).max(5, 'Рейтинг от 0 до 5'),
});

export const createProductSchema = baseProductSchema.extend({
  id: z.string().min(1, 'ID обязателен'),
});

export const updateProductSchema = baseProductSchema;
