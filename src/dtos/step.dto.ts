import z from 'zod';

export const updateStepScheme = z.object({
  title: z.string().min(1, 'Title is required').max(120, 'Title must not exceed 60 characters').optional(),
  content: z.any().optional(),
});

export type UpdateStepDto = z.infer<typeof updateStepScheme>;
