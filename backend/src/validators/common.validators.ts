import { isValidObjectId } from 'mongoose';
import { z } from 'zod';

export const objectIdSchema = z.string().refine((v) => isValidObjectId(v), 'Invalid id');

export const idParamSchema = z.object({ id: objectIdSchema });
export type IdParam = z.infer<typeof idParamSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
});
export type Pagination = z.infer<typeof paginationSchema>;
