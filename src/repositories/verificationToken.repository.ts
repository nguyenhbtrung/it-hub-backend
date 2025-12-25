import { prisma } from '../lib/prisma';
import { VerificationToken, Prisma } from '@/generated/prisma/client';

export class VerificationTokenRepository {
  async create(data: Prisma.VerificationTokenCreateInput): Promise<VerificationToken> {
    return prisma.verificationToken.create({ data });
  }

  async findByToken(token: string): Promise<VerificationToken | null> {
    return prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.verificationToken.delete({ where: { userId } });
  }

  async deleteExpired(): Promise<void> {
    await prisma.verificationToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
