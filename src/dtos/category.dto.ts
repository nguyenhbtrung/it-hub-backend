import { z } from 'zod';

export const getCategoriesQuerySchema = z.object({
  root: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((val) => val === 'true' || val === true),
  parentId: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  all: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => v === 'true' || v === true),
});

export type GetCategoriesQueryDTO = z.infer<typeof getCategoriesQuerySchema>;

export interface CategoryResponseDTO {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  createdAt: Date;
}
