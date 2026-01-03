import { CreatedCourseResponseDTO, GetCourseDetailInstructorViewResponseDTO } from '@/dtos/coures.dto';
import { NotFoundError } from '@/errors';
import { Course, CourseLevel, CourseStatus, Prisma, Section, UserRole } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { toAbsoluteURL } from '@/utils/file';

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

  async getCourseIdBySlug(slug: string) {
    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    return course.id;
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

  async getMaxSectionOrder(courseId: string) {
    const maxOrder = await prisma.section.aggregate({ where: { courseId: courseId }, _max: { order: true } });
    return maxOrder;
  }

  async addSection(data: Prisma.SectionCreateInput): Promise<Section> {
    const newSection = await prisma.section.create({ data });
    return newSection;
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
    instructorId: string,
    role?: UserRole
  ): Promise<GetCourseDetailInstructorViewResponseDTO> {
    const isAdmin = role === 'admin';
    const course = await prisma.course.findUnique({
      where: { id, OR: isAdmin ? [] : [{ status: 'published' }, { instructorId }] },
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

  async getCourseDetailByStudent(id: string, instructorId: string, role: string | undefined) {
    const isAdmin = role === 'admin';
    const course = await prisma.course.findUnique({
      where: { id, OR: isAdmin ? [] : [{ status: 'published' }, { instructorId }] },
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        description: true,
        category: { select: { id: true, name: true, slug: true } },
        subCategory: { select: { id: true, name: true, slug: true } },
        instructor: {
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
        level: true,
        totalDuration: true,
        keyTakeaway: true,
        requirements: true,
        tags: {
          select: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
        img: { select: { id: true, url: true } },
        promoVideo: { select: { id: true, url: true, metadata: true } },
        avgRating: true,
        reviewCount: true,
        updatedAt: true,
      },
    });
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    const lessonCount = await prisma.unit.count({
      where: { section: { courseId: id }, type: 'lesson' },
    });
    const materialCount = await prisma.material.count({
      where: { unit: { section: { courseId: id } } },
    });
    const students = await prisma.enrollment.count({
      where: { courseId: id, status: { in: ['active', 'completed'] } },
    });

    return {
      ...course,
      subCategory: course.subCategory ?? undefined,
      lessons: lessonCount,
      materials: materialCount,
      tags: course.tags.map((t) => t.tag),
      students,
      instructor: {
        id: course.instructor.id,
        fullname: course.instructor.fullname,
        avatarUrl: course.instructor.avatar?.url ? toAbsoluteURL(course.instructor.avatar?.url) : null,
      },
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

  async getUnitIdsByCourseId(courseId: string): Promise<string[]> {
    const units = await prisma.unit.findMany({
      where: { section: { courseId } },
      select: { id: true },
    });
    return units.map((u) => u.id);
  }

  async sumStepsDurationByUnitIds(unitIds: string[]): Promise<number> {
    if (!unitIds || unitIds.length === 0) return 0;
    const res = await prisma.step.aggregate({
      _sum: { duration: true },
      where: { lessonId: { in: unitIds } },
    });
    return res._sum.duration ?? 0;
  }

  async sumExcercisesDurationByUnitIds(unitIds: string[]): Promise<number> {
    if (!unitIds || unitIds.length === 0) return 0;
    const res = await prisma.excercise.aggregate({
      _sum: { duration: true },
      where: { unitId: { in: unitIds } },
    });
    return res._sum.duration ?? 0;
  }

  async recalcAndUpdateCourseTotalDuration(courseId: string): Promise<number> {
    const unitIds = await this.getUnitIdsByCourseId(courseId);

    if (unitIds.length === 0) {
      await prisma.course.update({
        where: { id: courseId },
        data: { totalDuration: 0 },
      });
      return 0;
    }

    const [stepsSum, excSum] = await Promise.all([
      this.sumStepsDurationByUnitIds(unitIds),
      this.sumExcercisesDurationByUnitIds(unitIds),
    ]);

    const total = stepsSum + excSum;

    await prisma.$transaction([
      prisma.course.update({
        where: { id: courseId },
        data: { totalDuration: total },
      }),
    ]);

    return total;
  }
}
