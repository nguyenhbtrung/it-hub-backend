import { UnitType } from '@/generated/prisma/enums';
import z from 'zod';

export const updateSectionScheme = z.object({
  title: z.string().min(1, 'Title is required').max(60, 'Title must not exceed 60 characters'),
  description: z.string().min(0, 'Description is required').max(120, 'Description must not exceed 120 characters'),
  objectives: z.array(z.string()).default([]),
});

export type UpdateSectionDto = z.infer<typeof updateSectionScheme>;

export const addUnitScheme = z.object({
  title: z.string().min(1, 'Title is required').max(60, 'Title must not exceed 60 characters'),
  description: z.string().min(0, 'Description is required').max(120, 'Description must not exceed 120 characters'),
  type: z.enum([UnitType.excercise, UnitType.lesson]),
});

export type AddUnitDto = z.infer<typeof addUnitScheme>;
