import { prisma } from '../lib/prisma';
import { PasswordResetToken, Prisma } from '@/generated/prisma/client';

export class PasswordResetTokenRepository {
  async create(data: Prisma.PasswordResetTokenCreateInput): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({ data });
  }

  async findByToken(token: string): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
  }

  async deleteExpired(): Promise<void> {
    await prisma.passwordResetToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
