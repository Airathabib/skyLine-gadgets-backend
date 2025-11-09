
import { z } from 'zod';

export const userSchema = z.object({
  login: z.string().min(3, 'Логин должен быть не короче 3 символов'),
  password: z.string().min(6, 'Пароль должен быть не короче 6 символов'),
  email: z.string().email('Неверный формат email'),
  phone: z.string().min(10, 'Телефон слишком короткий'),
});
