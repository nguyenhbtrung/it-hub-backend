import { z } from 'zod';

export const getTagsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  q: z.string().optional(),
});

export type GetTagsQueryDTO = z.infer<typeof getTagsQuerySchema>;
