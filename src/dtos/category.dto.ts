import { CourseLevel } from '@/generated/prisma/enums';
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

export const getCourseByCategoryIdQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  level: z
    .union([z.enum(CourseLevel), z.array(z.enum(CourseLevel))])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      return Array.isArray(val) ? val : [val];
    }),

  duration: z
    .union([
      z.enum(['extraShort', 'short', 'medium', 'long', 'extraLong']),
      z.array(z.enum(['extraShort', 'short', 'medium', 'long', 'extraLong'])),
    ])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      return Array.isArray(val) ? val : [val];
    }),

  avgRating: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .optional()
    .transform(Number),
  sortBy: z.enum(['popular', 'newest', 'rating']).optional(),
});

export type GetCourseByCategoryIdQueryDto = z.infer<typeof getCourseByCategoryIdQuerySchema>;
