import { User, UserRole, UserScope, UserStatus } from '@/generated/prisma/client';
import z from 'zod';

export interface UserResponseDTO {
  id: string;
  email: string;
  fullname: string | null;
  emailVerified: boolean;
  role: UserRole;
  scope: UserScope;
  createdAt: Date;
}

export function toUserResponseDTO(user: User): UserResponseDTO {
  return {
    id: user.id,
    email: user.email,
    fullname: user.fullname,
    emailVerified: user.emailVerified,
    role: user.role,
    scope: user.scope,
    createdAt: user.createdAt,
  };
}

export const createUserSchema = z.object({
  email: z.email('Invalid email format'),
  fullname: z.string().nullable().optional(),
  password: z.string('Password is required'),
  role: z.enum(UserRole),
  scope: z.enum(UserScope),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

export const updateMyProfileSchema = z.object({
  avatarId: z.string().nullable().optional(),
  fullname: z.string().nullable().optional(),
  school: z.string().nullable().optional(),
  specialized: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  githubUrl: z.url().nullable().optional(),
  linkedinUrl: z.url().nullable().optional(),
  websiteUrl: z.url().nullable().optional(),
});

export type UpdateMyProfileDto = z.infer<typeof updateMyProfileSchema>;

export const updateUserSchema = z.object({
  email: z.email('Invalid email format').optional(),
  fullname: z.string().nullable().optional(),
  school: z.string().nullable().optional(),
  specialized: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  githubUrl: z.url().nullable().optional(),
  linkedinUrl: z.url().nullable().optional(),
  websiteUrl: z.url().nullable().optional(),
  role: z.enum(UserRole).optional(),
  scope: z.enum(UserScope).optional(),
  status: z.enum(UserStatus).optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export const getUsersQueryScheme = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  q: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type GetUsersQueryDto = z.infer<typeof getUsersQueryScheme>;

export const getInstructorRegistrationsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  q: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type GetInstructorRegistrationsQueryDto = z.infer<typeof getInstructorRegistrationsQuerySchema>;
