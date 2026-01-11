import {
  AddSectionDto,
  CreateCourseDTO,
  CreateCourseResponseDTO,
  CreatedCourseResponseDTO,
  CreateOrUpdateReviewDto,
  GetCourseReviewsQueryDto,
  GetCoursesQueryDTO,
  GetFeaturedCoursesQueryDTO,
  GetMyCreatedCoursesDTO,
  GetNavigationByContentIdQueryDto,
  GetStudentsByCourseIdQueryDto,
  toCreateCourseResponseDTO,
  UpdateCourseDetailDTO,
} from '@/dtos/coures.dto';
import { toFileResponseDto } from '@/dtos/file.dto';
import { ForbiddenError, NotFoundError } from '@/errors';
import { CourseEnrollmentStatus, CourseLevel, CourseStatus, UserRole } from '@/generated/prisma/enums';
import { CourseRepository } from '@/repositories/course.repository';
import { EnrollmentRepository } from '@/repositories/enrollment.repository';
import { SectionRepository } from '@/repositories/section.repository';
import { StepRepository } from '@/repositories/step.repository';
import { TagRepository } from '@/repositories/tag.repository';
import { UnitRepository } from '@/repositories/unit.repository';
import { toAbsoluteURL } from '@/utils/file';
import { generateCourseSlug, generateTagSlug } from '@/utils/slug';

export class CourseService {
  constructor(
    private courseRepository: CourseRepository,
    private tagRepository: TagRepository,
    private enrollmentRepository: EnrollmentRepository,
    private stepRepository: StepRepository,
    private unitRepository: UnitRepository,
    private sectionRepository: SectionRepository
  ) {}
  async createCourse(payload: CreateCourseDTO, instructorId: string): Promise<CreateCourseResponseDTO> {
    const { title, categoryId, subCategoryId } = payload;
    const slug = generateCourseSlug(title);
    const shortDescription = '';
    const description = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
        },
      ],
    };
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

  async createOrUpdateReview(courseId: string, userId: string, payload: CreateOrUpdateReviewDto) {
    const review = await this.courseRepository.createOrUpdateReview(courseId, userId, payload);
    return review;
  }

  async updateCourseStatus(courseId: string, userId: string, role: string | undefined, status: CourseStatus) {
    const course = await this.courseRepository.getCourseInstructorId(courseId);

    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== userId && role !== 'admin') {
      throw new ForbiddenError('Permission denied');
    }
    if (role !== 'admin' && status !== 'pending' && status !== 'draft') {
      throw new ForbiddenError('Permission denied');
    }
    await this.courseRepository.updateCourseStatus(courseId, status);
  }

  async updateCourseTotalDuration(courseId: string) {
    return this.courseRepository.recalcAndUpdateCourseTotalDuration(courseId);
  }

  async updateCourseDetail(
    courseId: string,
    instructorId: string,
    role: UserRole | undefined,
    payload: UpdateCourseDetailDTO
  ): Promise<void> {
    const { title, categoryId, subCategoryId, description, shortDescription, level, requirements, keyTakeaway, tags } =
      payload;

    const course = await this.courseRepository.getCourseInstructorId(courseId);

    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== instructorId && role !== 'admin') {
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

  async getNavigationByContentId(contentId: string, query: GetNavigationByContentIdQueryDto) {
    const { contentType } = query;
    if (contentType === 'step') {
      const step = await this.stepRepository.getStepWithRelationById(contentId);
      if (!step) throw new NotFoundError();
      const nextStep = await this.stepRepository.getNextStep(step.lessonId, step.order);
      let nextUnit = null;
      let nextSection = null;
      if (!nextStep) {
        nextUnit = await this.unitRepository.getNextUnit(step.lesson.sectionId, step.lesson.order);
        if (!nextUnit) {
          nextSection = await this.sectionRepository.getNextSection(
            step.lesson.section.courseId,
            step.lesson.section.order
          );
        }
      }
      const previusStep = await this.stepRepository.getPreviousStep(step.lessonId, step.order);
      return {
        nextId: nextStep?.id || nextUnit?.id || nextSection?.id,
        nextType: nextStep
          ? 'step'
          : nextUnit
            ? nextUnit.type === 'lesson'
              ? 'lesson'
              : 'exercise'
            : nextSection
              ? 'section'
              : 'none',
        previousId: previusStep?.id || step.lessonId,
        previousType: previusStep ? 'step' : 'lesson',
      };
    }
    if (contentType === 'unit') {
      const unit = await this.unitRepository.getUnitWithRelationById(contentId);
      if (!unit) throw new NotFoundError();
      let nextUnit = null;
      let nextSection = null;
      if (!unit.steps?.[0]) {
        nextUnit = await this.unitRepository.getNextUnit(unit.sectionId, unit.order);
        if (!nextUnit) {
          nextSection = await this.sectionRepository.getNextSection(unit.section.courseId, unit.section.order);
        }
      }

      const previousUnit = await this.unitRepository.getPreviousUnit(unit.sectionId, unit.order);

      return {
        nextId: unit?.steps?.[0]?.id || nextUnit?.id || nextSection?.id,
        nextType: unit?.steps?.[0]
          ? 'step'
          : nextUnit
            ? nextUnit.type === 'lesson'
              ? 'lesson'
              : 'exercise'
            : nextSection
              ? 'section'
              : 'none',
        previousId: previousUnit?.steps?.[0]?.id || previousUnit?.id || unit.sectionId,
        previousType: previousUnit?.steps?.[0]
          ? 'step'
          : previousUnit
            ? previousUnit.type === 'lesson'
              ? 'lesson'
              : 'exercise'
            : 'section',
      };
    }
    const section = await this.sectionRepository.getSectionById(contentId);
    if (!section) throw new NotFoundError();
    const unit = await this.sectionRepository.getFirstUnitOfSection(contentId);
    let nextSection = null;
    if (!unit) {
      nextSection = await this.sectionRepository.getNextSection(section.courseId, section.order);
    }
    return {
      nextId: unit?.id || nextSection?.id,
      nextType: unit ? (unit.type === 'lesson' ? 'lesson' : 'exercise') : nextSection ? 'section' : 'none',
      previousType: 'none',
    };
  }

  async getRegistrationsByCoursesId(
    courseId: string,
    userId: string,
    role: string | undefined,
    query: GetStudentsByCourseIdQueryDto
  ) {
    const course = await this.courseRepository.getCourseInstructorId(courseId);

    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== userId && role !== 'admin') {
      throw new ForbiddenError('Permission denied: You are not the owner of this course');
    }
    const { page = 1, limit = 5 } = query;
    const take = Number(limit);
    const skip = (page - 1) * limit;
    const { registrations, total } = await this.courseRepository.getRegistrationsByCoursesId(courseId, take, skip);
    return {
      data: registrations,
      meta: { total, page: Number(page), limit: Number(limit) },
    };
  }

  async getStudentsByCourseId(
    courseId: string,
    userId: string,
    role: string | undefined,
    query: GetStudentsByCourseIdQueryDto
  ) {
    const course = await this.courseRepository.getCourseInstructorId(courseId);

    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== userId && role !== 'admin') {
      throw new ForbiddenError('Permission denied: You are not the owner of this course');
    }
    const { page = 1, limit = 5 } = query;
    const take = Number(limit);
    const skip = (page - 1) * limit;
    const { students, total } = await this.courseRepository.getStudentsByCourseId(courseId, take, skip);
    return {
      data: students.map((student) => ({
        ...student,
        avatar: student.avatar ? toAbsoluteURL(student.avatar) : null,
      })),
      meta: { total, page: Number(page), limit: Number(limit) },
    };
  }

  async getCourses(query: GetCoursesQueryDTO) {
    const {
      view = 'student',
      page = 1,
      limit = 5,
      q,
      level,
      duration,
      avgRating = 0,
      sortBy,
      sortOrder = 'asc',
      status,
    } = query;
    const take = Number(limit);
    const skip = (page - 1) * limit;
    const levels = !level || Array.isArray(level) ? level : [level];
    const durations = !duration || Array.isArray(duration) ? duration : [duration];
    if (view === 'admin') {
      const { courses, total } = await this.courseRepository.getCoursesByAdmin(
        take,
        skip,
        q,
        sortBy,
        sortOrder,
        status
      );

      return {
        data: courses.map((course: any) => ({
          ...course,
          img: course.img ? toFileResponseDto(course.img) : null,
          instructor: {
            ...course.instructor,
            avatar: course.instructor?.avatar ? toFileResponseDto(course.instructor.avatar) : null,
          },
        })),
        meta: { total, page: Number(page), limit: Number(limit) },
      };
    }
    const orderBy = sortBy || 'popular';
    const { courses, total } = await this.courseRepository.getCoursesByStudent(
      take,
      skip,
      q,
      levels,
      durations,
      avgRating,
      orderBy
    );
    return {
      data: courses.map((course: any) => ({
        ...course,
        img: course.img ? toFileResponseDto(course.img) : null,
      })),
      meta: { total, page: Number(page), limit: Number(limit) },
    };
  }

  async getRecommendedCourses(categoryId: string, userId?: string) {
    const courses = await this.courseRepository.getRecommendedCoursesByCategory(categoryId);
    return courses;
  }

  async getFeaturedCourses(query: GetFeaturedCoursesQueryDTO): Promise<any> {
    const { page = 1, limit = 10 } = query;
    const take = Number(limit);
    const skip = (page - 1) * limit;
    const { courses, total } = await this.courseRepository.getFeaturedCourses(take, skip);

    return {
      data: courses.map((course: any) => ({
        ...course,
        img: course.img ? toFileResponseDto(course.img) : null,
      })),
      meta: { total, page: Number(page), limit: Number(limit) },
    };
  }

  async getUserEnrollmentStatus(courseId: string, userId: string, role?: UserRole) {
    if (role !== 'admin') {
      const course = await this.courseRepository.getCourseInstructorId(courseId);
      if (!course) {
        throw new NotFoundError('Course not found');
      }
      if (course.instructorId !== userId) {
        const enrollment = await this.enrollmentRepository.getEnrollment(courseId, userId);
        if (!enrollment || enrollment.status === 'pending') return { status: enrollment?.status || null };
        const lastAccess = await this.courseRepository.getLastAccess(courseId, userId);
        return {
          status: enrollment?.status,
          lastAccess,
        };
      }
    }
    const lastAccess = await this.courseRepository.getLastAccess(courseId, userId);
    return {
      status: 'active',
      lastAccess,
    };
  }

  async getCourseIdBySlug(slug: string): Promise<string> {
    const id = await this.courseRepository.getCourseIdBySlug(slug);
    return id;
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

  async getCourseInstructor(id: string, userId: string, role?: UserRole) {
    const instructor = await this.courseRepository.getCourseInstructor(id, userId, role);
    if (!instructor) throw new NotFoundError();
    return { ...instructor, avatar: instructor?.avatar ? toFileResponseDto(instructor.avatar) : null };
  }

  async getCourseReviewStatistics(id: string, userId: string, role: UserRole | undefined) {
    const statistics = await this.courseRepository.getCourseReviewStatistics(id, userId, role);
    return statistics;
  }

  async getCourseReviews(id: string, userId: string, role: UserRole | undefined, query: GetCourseReviewsQueryDto) {
    const { page = 1, limit = 5, sortBy, sortOrder } = query;
    const take = Number(limit);
    const skip = (page - 1) * limit;
    const { reviews, total } = await this.courseRepository.getCourseReviews(id, userId, take, skip, sortBy, sortOrder);
    return {
      data: reviews.map((review) => ({
        ...review,
        user: { ...review.user, avatar: review.user.avatar ? toFileResponseDto(review.user.avatar) : null },
      })),
      meta: { total, page: Number(page), limit: Number(limit) },
    };
  }

  async getMyReviewOfTheCourse(id: string, userId: string) {
    const review = await this.courseRepository.getMyReviewOfTheCourse(id, userId);
    if (!review) return null;
    return {
      ...review,
      user: review
        ? { ...review?.user, avatar: review?.user.avatar ? toFileResponseDto(review.user.avatar) : null }
        : undefined,
    };
  }

  async getCourseDetail(id: string, userId: string, role?: UserRole, view: 'instructor' | 'student' = 'student') {
    if (view === 'instructor') {
      const course = await this.courseRepository.getCourseDetailByInstructor(id, userId, role);
      return {
        ...course,
        img: course.img ? toFileResponseDto(course.img) : null,
        promoVideo: course.promoVideo ? toFileResponseDto(course.promoVideo) : null,
      };
    }
    const course = await this.courseRepository.getCourseDetailByStudent(id, userId, role);
    return {
      ...course,
      img: course.img ? toFileResponseDto(course.img) : null,
      promoVideo: course.promoVideo ? toFileResponseDto(course.promoVideo) : null,
    };
  }

  async getCourseContent(id: string, userId: string, role?: UserRole, view: 'instructor' | 'student' = 'student') {
    if (view === 'instructor') {
      const courseContent = await this.courseRepository.getCourseContentByInstructor(id, userId, role);
      return courseContent;
    }
    const courseContent = await this.courseRepository.getCourseContentByStudent(id, userId, role);
    return courseContent;
  }

  async getCourseContentOutline(id: string, userId: string, role?: UserRole) {
    const courseContent = await this.courseRepository.getCourseContentOutline(id, userId, role);
    const sectionsWithDuration = courseContent?.sections.map((section) => ({
      ...section,
      units: section.units.map((unit) => {
        const stepDuration = unit.steps.reduce((sum, s) => sum + (s.duration ?? 0), 0);
        const excerciseDuration = unit.excercises.reduce((sum, e) => sum + (e.duration ?? 0), 0);
        const totalDuration = stepDuration + excerciseDuration;

        return {
          ...unit,
          totalDuration,
        };
      }),
    }));

    return {
      ...courseContent,
      sections: sectionsWithDuration,
    };
  }

  async getContentBreadcrumb(contentId: string, type: 'section' | 'unit' | 'step') {
    const contentBreadcrumb = await this.courseRepository.getContentBreadcrumb(contentId, type);
    return contentBreadcrumb;
  }

  async addSection(courseId: string, instructorId: string, payload: AddSectionDto) {
    const { title, description, objectives } = payload;
    const course = await this.courseRepository.getCourseInstructorId(courseId);

    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new ForbiddenError('Permission denied: You are not the owner of this course');
    }

    const maxOrder = await this.courseRepository.getMaxSectionOrder(courseId);
    const nextOrder = (maxOrder._max.order ?? 0) + 1;

    const newSection = await this.courseRepository.addSection({
      course: { connect: { id: courseId } },
      title,
      description,
      objectives,
      order: nextOrder,
    });
    return {
      id: newSection.id,
      courseId: newSection.courseId,
      title: newSection.title,
      description: newSection.description,
      objectives: newSection.objectives,
      order: newSection.order,
      units: [],
    };
  }

  async updateCourseImage(courseId: string, imageId: string, instructorId: string): Promise<void> {
    const course = await this.courseRepository.getCourseInstructorId(courseId);

    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new ForbiddenError('Permission denied: You are not the owner of this course');
    }

    await this.courseRepository.updateCourseImage(courseId, imageId);
  }

  async updatePromoVideoImage(courseId: string, promoVideoId: string, instructorId: string): Promise<void> {
    const course = await this.courseRepository.getCourseInstructorId(courseId);

    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new ForbiddenError('Permission denied: You are not the owner of this course');
    }

    await this.courseRepository.updateCoursePromoVideo(courseId, promoVideoId);
  }
}
