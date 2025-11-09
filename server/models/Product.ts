export interface Product {
  id: string;
  brand: string;
  category: string;
  quantity: number;
  title: string;
  description: string;
  price: number;
  like: number;
  addedToCart: number;
  accum: string;
  memory: string;
  photo: string;
  rating: number;
}

export interface Brand {
  name: string;
}

export interface BrandCountResult {
  cnt: number;
}

export interface Rating {
  id: number;
  user_id: number;
  product_id: string;
  rating: number;
}

export interface AvgRating {
  average: number | null;
  count: number;
}
export interface CartItem {
  quantity: number;
}
