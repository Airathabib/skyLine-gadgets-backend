export interface Comment {
  id: number;
  userId: number;
  parent_id: number | null;
  user_name: string;
  user_comment: string;
  date: string;
  productId: string;
  replies?: Comment[];
}
