import { CreatedCourseResponseDTO } from '@/dtos/coures.dto';
import { Course, CourseStatus, Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export class CourseRepository {
  async create(data: Prisma.CourseCreateInput): Promise<Course> {
    return prisma.course.create({ data });
  }

  async getInstructorCreatedCourses(
    take: number,
    skip: number,
    status: CourseStatus | undefined,
    instructorId: string
  ): Promise<[CreatedCourseResponseDTO[], number]> {
    const where = { status, instructorId };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          category: { select: { name: true } },
          subCategory: { select: { name: true } },
          img: { select: { url: true } },
          enrollments: {
            where: { status: { in: ['active', 'completed'] } },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    const data: CreatedCourseResponseDTO[] = courses.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category.name,
      subCategory: c.subCategory?.name,
      imgUrl: c.img?.url ?? null,
      students: c.enrollments.length,
      status: c.status,
    }));

    return [data, total];
  }
}
