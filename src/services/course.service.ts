import {
  CreateCourseDTO,
  CreateCourseResponseDTO,
  CreatedCourseResponseDTO,
  GetCourseDetailByInstructorResponseDTO,
  GetMyCreatedCoursesDTO,
  toCreateCourseResponseDTO,
  UpdateCourseDetailDTO,
} from '@/dtos/coures.dto';
import { ForbiddenError, NotFoundError } from '@/errors';
import { CourseEnrollmentStatus, CourseLevel, CourseStatus } from '@/generated/prisma/enums';
import { CourseRepository } from '@/repositories/course.repository';
import { TagRepository } from '@/repositories/tag.repository';
import { generateCourseSlug, generateTagSlug } from '@/utils/slug';

export class CourseService {
  constructor(
    private courseRepository: CourseRepository,
    private tagRepository: TagRepository
  ) {}
  async createCourse(payload: CreateCourseDTO, instructorId: string): Promise<CreateCourseResponseDTO> {
    const { title, categoryId, subCategoryId } = payload;
    const slug = generateCourseSlug(title);
    const shortDescription = '';
    const description = {};
    const level = CourseLevel.beginner;
    const totalDuration = 0;
    const enrollmentStatus = CourseEnrollmentStatus.public;
    const status = CourseStatus.draft;
    const keyTakeaway: string[] = [];
    const requirements: string[] = [];

    const newCourse = await this.courseRepository.create({
      title,
      category: { connect: { id: categoryId } },
      subCategory: { connect: { id: subCategoryId } },
      slug,
      shortDescription,
      description,
      level,
      totalDuration,
      enrollmentStatus,
      status,
      keyTakeaway,
      requirements,
      instructor: { connect: { id: instructorId } },
    });

    return toCreateCourseResponseDTO(newCourse);
  }

  async updateCourseDetail(courseId: string, instructorId: string, payload: UpdateCourseDetailDTO): Promise<void> {
    const { title, categoryId, subCategoryId, description, shortDescription, level, requirements, keyTakeaway, tags } =
      payload;

    const course = await this.courseRepository.getCourseInstructorId(courseId);

    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new ForbiddenError('Permission denied: You are not the owner of this course');
    }

    const slug = generateCourseSlug(title);
    const tagSlugs = tags.map(generateTagSlug);
    const originalTagNameMap: Record<string, string> = tags.reduce(
      (acc, tag) => {
        acc[generateTagSlug(tag)] = tag;
        return acc;
      },
      {} as Record<string, string>
    );

    const existingTags = await this.tagRepository.getTagsBySlugs(tagSlugs);

    const existingTagSlugs = new Set(existingTags.map((t) => t.slug));

    const newTags = tagSlugs
      .filter((slug) => !existingTagSlugs.has(slug))
      .map((slug) => ({
        name: originalTagNameMap[slug],
        slug,
      }));

    await this.courseRepository.updateCourseDetail(
      courseId,
      {
        title,
        slug,
        categoryId,
        subCategoryId,
        description,
        shortDescription,
        level,
        requirements,
        keyTakeaway,
      },
      {
        newTags,
        tagSlugs,
      }
    );
  }

  async getMyCreatedCourses(
    query: GetMyCreatedCoursesDTO,
    instructorId: string
  ): Promise<{ data: CreatedCourseResponseDTO[]; meta: any }> {
    const { page = 1, limit = 10, status } = query;
    const take = Number(limit);
    const skip = (page - 1) * limit;
    const [data, total] = await this.courseRepository.getInstructorCreatedCourses(take, skip, status, instructorId);

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getCourseDetailByInstructor(id: string, instructorId: string): Promise<GetCourseDetailByInstructorResponseDTO> {
    return await this.courseRepository.getCourseDetailByInstructor(id, instructorId);
  }
}
