import { UnitType } from '@/generated/prisma/enums';
import z from 'zod';

export const updateUnitScheme = z.object({
  title: z.string().min(1, 'Title is required').max(60, 'Title must not exceed 60 characters'),
  description: z
    .string()
    .min(0, 'Description is required')
    .max(120, 'Description must not exceed 120 characters')
    .optional(),
});

export type UpdateUnitDto = z.infer<typeof updateUnitScheme>;
