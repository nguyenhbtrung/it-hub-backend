import { CreatedCourseResponseDTO, GetCourseDetailByInstructorResponseDTO } from '@/dtos/coures.dto';
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

  async getCourseDetailByInstructor(id: string, instructorId: string): Promise<GetCourseDetailByInstructorResponseDTO> {
    const course = await prisma.course.findUnique({
      where: { id, instructorId },
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        description: true,
        category: { select: { id: true, name: true } },
        subCategory: { select: { id: true, name: true } },
        level: true,
        keyTakeaway: true,
        requirements: true,
        tags: {
          select: {
            tag: { select: { name: true } },
          },
        },
        img: { select: { url: true } },
        promoVideo: { select: { url: true } },
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      shortDescription: course.shortDescription,
      description: course.description,
      category: course.category,
      subCategory: course.subCategory ?? undefined,
      level: course.level,
      keyTakeaway: course.keyTakeaway,
      requirements: course.requirements,
      tags: course.tags.map((t) => t.tag.name),
      imgUrl: course.img?.url ?? null,
      promoVideoUrl: course.promoVideo?.url ?? null,
    };
  }
}
