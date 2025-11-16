export interface DbUser {
  login: string;
  password: string;
  email: string;
  phone: string;
  role?: string;
}

export interface DbComment {
  user_name: string;
  user_comment: string;
  date: string;
  productId: string;
  parent_id?: number | null;
}

export interface DbProduct {
  id: string;
  brand: string;
  category: string;
  quantity: number;
  title: string;
  description: string;
  price: number;
  accum: string;
  memory: string;
  photo: string;
  rating: number;
}

export interface DbJson {
  users: DbUser[];
  comments: DbComment[];
  products: DbProduct[];
  brands: string[];
  cart: { id: string; quantity: number }[];
}
