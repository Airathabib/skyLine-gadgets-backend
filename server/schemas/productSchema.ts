import { z } from 'zod';

// Базовая схема для Product (без id)
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

// Схема для POST /products (id обязателен и строка)
export const createProductSchema = z.object({
  id: z.string().min(1),
  brand: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().int().min(0),
  title: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  accum: z.string().min(1),
  memory: z.string().min(1),
  photo: z.string().min(1, 'Фото обязательно'),
  rating: z.number().min(0).max(5),
  like: z.boolean(),
  addedToCart: z.boolean(),
});

// Схема для PATCH /products/:id (только like)
export const toggleLikeSchema = z.object({
  like: z.boolean(),
});

// Схема для обновления (PUT) — все поля, но id не в теле
export const updateProductSchema = baseProductSchema.extend({
  like: z.boolean(),
  addedToCart: z.boolean(),
});
