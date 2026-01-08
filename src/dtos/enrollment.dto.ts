import { EnrollmentStatus } from '@/generated/prisma/enums';
import z from 'zod';

export const updateEnrollmentSchema = z.object({
  status: z.enum(EnrollmentStatus),
});

export type UpdateEnrollmentDto = z.infer<typeof updateEnrollmentSchema>;
