export interface Comment {
  id: number;
  user_id: number;
  parent_id: number | null;
  userName: string;
  userComment: string;
  date: string;
  productId: string;
  replies?: Comment[];
}
