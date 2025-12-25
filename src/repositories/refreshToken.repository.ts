import { prisma } from '../lib/prisma';
import { RefreshToken, Prisma } from '@/generated/prisma/client';

export class RefreshTokenRepository {
  async create(data: Prisma.RefreshTokenCreateInput): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data });
  }

  async findByToken(token: string): Promise<Prisma.RefreshTokenGetPayload<{ include: { user: true } }> | null> {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async deleteByToken(token: string): Promise<void> {
    await prisma.refreshToken.delete({ where: { token } });
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async deleteExpired(): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
