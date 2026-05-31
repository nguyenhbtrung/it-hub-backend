import { EnrollmentStatus, Prisma } from '@/generated/prisma/client';
import { EnrollmentWhereInput } from '@/generated/prisma/models';
import { prisma } from '@/lib/prisma';

export class EnrollmentRepository {
  async getEnrollmentsWithCourseByUserId(userId: string, skip: number, take: number, status: EnrollmentStatus) {
    const where: EnrollmentWhereInput = {
      userId,
      status,
    };

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take,
        orderBy: [{ enrolledAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          createdAt: true,
          enrolledAt: true,
          status: true,
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              shortDescription: true,
              instructor: {
                select: {
                  fullname: true,
                },
              },
              status: true,
              category: { select: { name: true } },
              subCategory: { select: { name: true } },
              level: true,
              avgRating: true,
              reviewCount: true,
              totalDuration: true,
              img: { select: { url: true } },
              createdAt: true,
              _count: {
                select: {
                  enrollments: {
                    where: { status: { in: ['active', 'completed'] } },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.enrollment.count({
        where,
      }),
    ]);
    return { enrollments, total };
  }

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

  async getEnrollmentsOfInstructorFromDate(userId: string, startDate: Date) {
    return prisma.enrollment.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        course: {
          instructorId: userId,
        },
        status: {
          in: ['active', 'completed'],
        },
      },
      select: {
        createdAt: true,
      },
    });
  }

  async getEnrollmentsFromDate(startDate: Date) {
    return prisma.enrollment.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
    });
  }

  async getRecentEnrollmentsByInstructorId(instructorId: string, limit: number) {
    return prisma.enrollment.findMany({
      where: {
        status: 'pending',
        course: {
          instructorId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullname: true,
            avatar: {
              select: {
                url: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async countActiveStudentsByCourseId(courseId: string) {
    return prisma.enrollment.count({
      where: {
        courseId,
        status: {
          in: ['active', 'completed'],
        },
      },
    });
  }

  async countActiveStudentbyInstructorId(instructorId: string) {
    return prisma.enrollment.count({
      where: {
        course: {
          instructorId,
        },
        status: {
          in: ['active', 'completed'],
        },
      },
    });
  }

  async countNewStudentsThisMonthByInstructorId(instructorId: string) {
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return prisma.enrollment.count({
      where: {
        status: {
          in: ['active', 'completed'],
        },
        course: {
          instructorId,
        },
        enrolledAt: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
    });
  }

  async countTotalStudents() {
    const result = await prisma.enrollment.findMany({
      distinct: ['userId'],
      where: {
        status: { in: ['active', 'completed'] },
      },
      select: {
        userId: true,
      },
    });

    return result.length;
  }

  async countStudentsFromDate(date: Date) {
    const result = await prisma.enrollment.findMany({
      where: {
        status: { in: ['active', 'completed'] },
        enrolledAt: {
          gte: date,
        },
      },
      distinct: ['userId'],
      select: {
        userId: true,
      },
    });

    return result.length;
  }

  async countStudentsThisMonth() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return this.countStudentsFromDate(startOfMonth);
  }

  async countStudentsLastMonth() {
    const now = new Date();

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await prisma.enrollment.findMany({
      where: {
        status: { in: ['active', 'completed'] },
        enrolledAt: {
          gte: startOfLastMonth,
          lt: endOfLastMonth,
        },
      },
      distinct: ['userId'],
      select: {
        userId: true,
      },
    });

    return result.length;
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
