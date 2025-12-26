import { User, UserRole, UserScope } from '@/generated/prisma/client';

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
