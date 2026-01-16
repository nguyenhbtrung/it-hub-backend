import z from 'zod';

export const updateUnitScheme = z.object({
  title: z.string().min(1, 'Title is required').max(120, 'Title must not exceed 60 characters'),
  description: z.string().min(0, 'Description is required').optional(),
});

export type UpdateUnitDto = z.infer<typeof updateUnitScheme>;

export const addStepScheme = z.object({
  title: z.string().min(1, 'Title is required').max(120, 'Title must not exceed 60 characters'),
});

export type AddStepDto = z.infer<typeof addStepScheme>;

export const addMaterialScheme = z.object({
  fileId: z.string(),
});

export type AddMaterialDto = z.infer<typeof addMaterialScheme>;
