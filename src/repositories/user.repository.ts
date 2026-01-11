import { prisma } from '../lib/prisma';
import { User, Prisma } from '@/generated/prisma/client';

export class UserRepository {
  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        scope: true,
        instructorApplicationAt: true,
        avatar: {
          select: {
            url: true,
          },
        },
        profile: {
          select: {
            bio: true,
            school: true,
            specialized: true,
            skill: true,
            githubUrl: true,
            linkedinUrl: true,
            websiteUrl: true,
          },
        },
      },
    });
    return user;
  }
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { passwordHash: hashedPassword },
    });
  }

  async verifyEmail(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { emailVerified: true },
    });
  }
}
