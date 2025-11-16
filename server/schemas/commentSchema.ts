import { z } from 'zod';

export const commentSchema = z.object({
  userName: z.string().min(1),
  userComment: z.string().min(1),
  productId: z.string().min(1),
  parentId: z.number().optional().nullable(),
});

export const updateCommentSchema = z.object({
  userComment: z.string().min(1),
});
