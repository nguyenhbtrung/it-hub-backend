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
}
