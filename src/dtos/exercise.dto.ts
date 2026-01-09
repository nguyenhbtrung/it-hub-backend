import { ExcerciseType } from '@/generated/prisma/enums';
import z from 'zod';

export const updateExerciseScheme = z.object({
  type: z.enum(ExcerciseType).optional(),
  title: z.string().min(1, 'Title is required').max(60, 'Title must not exceed 60 characters').optional(),
  description: z.string().optional(),
  content: z.any().optional(),
  deadline: z.coerce.date().optional(),
  duration: z.number().int().positive().optional(),
  passingScore: z.number().min(0).max(100).optional(),
});

export type UpdateExerciseDto = z.infer<typeof updateExerciseScheme>;
