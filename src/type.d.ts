import { UserRole, UserScope } from './generated/prisma/enums';

export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
  scope: UserScope;
}

declare global {
  namespace Express {
    type User = UserPayload;
  }
}
