import { EnrollmentStatus } from '@/generated/prisma/enums';
import z from 'zod';

export const updateEnrollmentSchema = z.object({
  status: z.enum(EnrollmentStatus),
});

export type UpdateEnrollmentDto = z.infer<typeof updateEnrollmentSchema>;

export const deleteEnrollmentQuerySchema = z.object({
  userId: z.string().optional(),
});

export type DeleteEnrollmentQueryDto = z.infer<typeof deleteEnrollmentQuerySchema>;

export const createEnrollmentQuerySchema = z.object({
  userId: z.string().optional(),
});

export type CreateEnrollmentQueryDto = z.infer<typeof createEnrollmentQuerySchema>;

export const createEnrollmentSchema = z.object({
  status: z.enum(EnrollmentStatus),
});

export type CreateEnrollmentDto = z.infer<typeof createEnrollmentSchema>;
