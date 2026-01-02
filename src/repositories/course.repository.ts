import { CreatedCourseResponseDTO, GetCourseDetailInstructorViewResponseDTO } from '@/dtos/coures.dto';
import { NotFoundError } from '@/errors';
import { Course, CourseLevel, CourseStatus, Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

interface UpdateCourseDetailData {
  title: string;
  slug: string;
  categoryId: string;
  subCategoryId: string;
  description: Prisma.InputJsonValue;
  shortDescription: string;
  level: CourseLevel;
  requirements: string[];
  keyTakeaway: string[];
}

interface UpdateCourseTagData {
  newTags: { name: string; slug: string }[];
  tagSlugs: string[];
}

export class CourseRepository {
  async create(data: Prisma.CourseCreateInput): Promise<Course> {
    return prisma.course.create({ data });
  }

  async updateCourseDetail(id: string, data: UpdateCourseDetailData, tagData: UpdateCourseTagData): Promise<Course> {
    return prisma.$transaction(async (tx) => {
      if (tagData.newTags.length) {
        await tx.tag.createMany({
          data: tagData.newTags,
          skipDuplicates: true,
        });
      }
      const allTags = await tx.tag.findMany({
        where: { slug: { in: tagData.tagSlugs } },
      });

      await tx.courseTag.deleteMany({
        where: { courseId: id },
      });

      await tx.courseTag.createMany({
        data: allTags.map((tag) => ({
          courseId: id,
          tagId: tag.id,
        })),
      });

      return tx.course.update({ where: { id }, data });
    });
  }

  async updateCourseImage(courseId: string, imgId: string): Promise<any> {
    return prisma.course.update({ where: { id: courseId }, data: { imgId } });
  }

  async updateCoursePromoVideo(courseId: string, promoVideoId: string): Promise<any> {
    return prisma.course.update({ where: { id: courseId }, data: { promoVideoId } });
  }

  async getCourseInstructorId(courseId: string) {
    return prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
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

  async getCourseDetailByInstructor(
    id: string,
    instructorId: string
  ): Promise<GetCourseDetailInstructorViewResponseDTO> {
    const course = await prisma.course.findUnique({
      where: { id, OR: [{ status: 'published' }, { instructorId }] },
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
        img: { select: { id: true, url: true } },
        promoVideo: { select: { id: true, url: true } },
      },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
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
      img: course.img,
      promoVideo: course.promoVideo,
    };
  }

  async getCourseContentByInstructor(courseId: string, instructorId: string) {
    const courseContent = await prisma.course.findUnique({
      where: { id: courseId, OR: [{ status: 'published' }, { instructorId }] },
      select: {
        sections: {
          select: {
            id: true,
            courseId: true,
            title: true,
            description: true,
            objectives: true,
            order: true,
            units: {
              select: {
                id: true,
                sectionId: true,
                title: true,
                description: true,
                order: true,
                type: true,
                steps: {
                  select: {
                    id: true,
                    lessonId: true,
                    title: true,
                    order: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return courseContent;
  }
}
