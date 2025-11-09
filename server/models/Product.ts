export interface Product {
  id: string;
  brand: string;
  category: string;
  quantity: number;
  title: string;
  description: string;
  price: number;
  addedToCart: boolean;
  accum: string;
  memory: string;
  photo?: string;
  rating: number;
}
