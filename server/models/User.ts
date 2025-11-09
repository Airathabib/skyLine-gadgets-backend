export interface User {
  id: number;
  login: string;
  password: string; // ⚠️ в реальном проекте — хэш!
  email: string;
  phone: string;
  role: string;
}
