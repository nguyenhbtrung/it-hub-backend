import { prisma } from '../lib/prisma';
import { User, Prisma } from '@/generated/prisma/client';

export class UserRepository {
  private toCreateInput(userId: string, data: Prisma.UserProfileUpdateInput): Prisma.UserProfileCreateInput {
    return {
      user: { connect: { id: userId } },
      bio: typeof data.bio === 'string' ? data.bio : undefined,
      school: typeof data.school === 'string' ? data.school : undefined,
      specialized: typeof data.specialized === 'string' ? data.specialized : undefined,
      githubUrl: typeof data.githubUrl === 'string' ? data.githubUrl : undefined,
      linkedinUrl: typeof data.linkedinUrl === 'string' ? data.linkedinUrl : undefined,
      websiteUrl: typeof data.websiteUrl === 'string' ? data.websiteUrl : undefined,
      skill: data.skill as any,
    };
  }

  async getUsers(
    take: number,
    skip: number,
    q: string | undefined,
    sortBy: string | undefined,
    sortOrder: 'asc' | 'desc'
  ) {
    const searchConditions = q
      ? [
          { fullname: { contains: q, mode: 'insensitive' as const } },
          { email: { contains: q, mode: 'insensitive' as const } },
        ]
      : [];

    const where: Prisma.UserWhereInput = {
      OR: q ? searchConditions : undefined,
    };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take,
        skip,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        select: {
          id: true,
          fullname: true,
          email: true,
          role: true,
          scope: true,
          status: true,
          createdAt: true,
          avatar: { select: { url: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }
  async getPassword(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
      },
    });
    return user?.passwordHash;
  }
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
            id: true,
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

  async update(id: string, data: Prisma.UserUpdateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const user = await client.user.update({
      where: { id },
      data,
    });
    return user;
  }

  async updateProfile(userId: string, data: Prisma.UserProfileUpdateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const user = await client.userProfile.upsert({
      where: { userId },
      update: data,
      create: this.toCreateInput(userId, data),
    });
    return user;
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
