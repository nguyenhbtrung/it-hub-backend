import { ExcerciseType } from '@/generated/prisma/enums';
import z from 'zod';

export const updateExerciseScheme = z.object({
  type: z.enum(ExcerciseType).optional(),
  title: z.string().min(0, 'Title is required').max(120, 'Title must not exceed 60 characters').optional(),
  description: z.string().optional(),
  content: z.any().optional(),
  deadline: z.coerce.date().nullable().optional(),
  duration: z.number().int().positive().nullable().optional(),
  passingScore: z.number().min(0).max(10).nullable().optional(),
});

export type UpdateExerciseDto = z.infer<typeof updateExerciseScheme>;

export const addSubmissionScheme = z.object({
  score: z.number().min(0).max(10).nullable().optional(),
  demoUrl: z.array(z.string()).optional(),
  note: z.string().nullable().optional(),
  fileIds: z.array(z.string()).nullable().optional(),
});

export type AddSubmissionDto = z.infer<typeof addSubmissionScheme>;
