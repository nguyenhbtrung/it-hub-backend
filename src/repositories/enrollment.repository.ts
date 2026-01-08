import { Prisma } from '@/generated/prisma/client';
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

  async updateEnrollment(courseId: string, userId: string, payload: Prisma.EnrollmentUpdateInput) {
    const enrollment = await prisma.enrollment.update({
      where: { courseId_userId: { courseId, userId } },
      data: payload,
    });
    return enrollment;
  }

  async deleteEnrollment(courseId: string, userId: string) {
    await prisma.enrollment.delete({
      where: { courseId_userId: { courseId, userId } },
    });
  }
}
