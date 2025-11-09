// server/utils/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'secret123'; // ← замени на .env в продакшене!

export const generateToken = (user: {
  id: number;
  login: string;
  role: string;
}) => {
  return jwt.sign(
    { id: user.id, login: user.login, role: user.role },
    JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: number;
      login: string;
      role: string;
    };
  } catch (err) {
    return null;
  }
};
