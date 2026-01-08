import { EnrollmentStatus, Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export class EnrollmentRepository {
  async getEnrollment(courseId: string, userId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });
    return enrollment;
  }

  async createEnrollment(courseId: string, userId: string, status: EnrollmentStatus) {
    const enrollment = await prisma.enrollment.create({
      data: {
        courseId,
        userId,
        status,
        enrolledAt: status === 'active' ? new Date() : undefined,
      },
    });
    return enrollment;
  }

  async updateEnrollment(courseId: string, userId: string, data: Prisma.EnrollmentUpdateInput) {
    const enrollment = await prisma.enrollment.update({
      where: { courseId_userId: { courseId, userId } },
      data,
    });
    return enrollment;
  }

  async deleteEnrollment(courseId: string, userId: string) {
    await prisma.enrollment.delete({
      where: { courseId_userId: { courseId, userId } },
    });
  }
}
