import { User, UserRole, UserScope } from '@/generated/prisma/client';
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
