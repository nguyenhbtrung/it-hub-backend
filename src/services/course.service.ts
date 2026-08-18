import {
  AddSectionDto,
  CreateCourseDTO,
  CreateCourseResponseDTO,
  CreatedCourseResponseDTO,
  CreateOrUpdateReviewDto,
  getCourseExercisesGroupedBySectionQueryDto,
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
import { GetLearningCoursesQueryDto } from '@/dtos/user.dto';
import { CacheService } from '@/common/cache/cache.service';
import { ForbiddenError, NotFoundError } from '@/errors';
import { CourseEnrollmentStatus, CourseLevel, CourseStatus, LearningStatus, UserRole } from '@/generated/prisma/enums';
import { RedisKeys } from '@/infra/redis/redis.keys';
import {
  CourseRepository,
  EnrollmentRepository,
  ExerciseRepository,
  SectionRepository,
  StepRepository,
  TagRepository,
  UnitRepository,
} from '@/repositories';
import { CourseIndexes } from '@/types/course.types';
import { toAbsoluteURL } from '@/utils/file';
import { generateCourseSlug, generateTagSlug } from '@/utils/slug';
import { Injectable } from '@ntrg/simple-di';

type WithStatus<T> = T & { status: LearningStatus | 'not_started' };

@Injectable()
export class CourseService {
  constructor(
    private courseRepository: CourseRepository,
    private tagRepository: TagRepository,
    private enrollmentRepository: EnrollmentRepository,
    private stepRepository: StepRepository,
    private unitRepository: UnitRepository,
    private sectionRepository: SectionRepository,
    private exerciseRepository: ExerciseRepository
  ) {}

  private async invalidateCourseCaches(courseId?: string) {
    const patterns = [
      'courses:catalog:*',
      'course:detail:*',
      'course:content:*',
      'courses:featured:*',
      'learning-courses:*',
      'courses:by-category:*',
    ];

    if (courseId) {
      patterns.push(`course:detail:${courseId}:*`);
      patterns.push(`course:content:${courseId}:*`);
    }

    await Promise.all(patterns.map((pattern) => CacheService.delByPattern(pattern)));
  }

  private buildCourseCatalogCacheKey(query: GetCoursesQueryDTO) {
    const {
      view = 'student',
      page = 1,
      limit = 5,
      q = '',
      level,
      duration,
      avgRating = 0,
      sortBy,
      sortOrder = 'asc',
      status,
    } = query;

    const normalizedLevel = Array.isArray(level) ? level.join(',') : level || '';
    const normalizedDuration = Array.isArray(duration) ? duration.join(',') : duration || '';

    return RedisKeys.courseCatalog(
      `${view}:${Number(page)}:${Number(limit)}:${q}:${normalizedLevel}:${normalizedDuration}:${Number(avgRating)}:${sortBy || ''}:${sortOrder}:${status || ''}`
    );
  }

  private buildCourseDetailCacheKey(
    courseId: string,
    userId: string,
    role?: UserRole,
    view: 'instructor' | 'student' = 'student'
  ) {
    return RedisKeys.courseDetail(courseId, view, userId, role);
  }

  private buildCourseContentCacheKey(
    courseId: string,
    userId: string,
    role?: UserRole,
    view: 'instructor' | 'student' = 'student'
  ) {
    return RedisKeys.courseContent(courseId, view, userId, role);
  }

  private buildFeaturedCoursesCacheKey(page: number, limit: number) {
    return RedisKeys.featuredCourses(page, limit);
  }

  private buildLearningCoursesCacheKey(userId: string, status: string, page: number, limit: number) {
    return RedisKeys.learningCourses(userId, status, page, limit);
  }

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

    await this.invalidateCourseCaches();

    return toCreateCourseResponseDTO(newCourse);
  }

  async createOrUpdateReview(courseId: string, userId: string, payload: CreateOrUpdateReviewDto) {
    const review = await this.courseRepository.createOrUpdateReview(courseId, userId, payload);
    await this.invalidateCourseCaches(courseId);
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
    await this.invalidateCourseCaches(courseId);
  }

  async updateCourseTotalDuration(courseId: string) {
    const result = await this.courseRepository.recalcAndUpdateCourseTotalDuration(courseId);
    await this.invalidateCourseCaches(courseId);
    return result;
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

    await this.invalidateCourseCaches(courseId);
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

    const cacheKey = this.buildCourseCatalogCacheKey(query);
    const cachedResult = await CacheService.get<any>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

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

      const result = {
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
      await CacheService.set(cacheKey, result, 300);
      return result;
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
    const result = {
      data: courses.map((course: any) => ({
        ...course,
        img: course.img ? toFileResponseDto(course.img) : null,
      })),
      meta: { total, page: Number(page), limit: Number(limit) },
    };
    await CacheService.set(cacheKey, result, 60 * 60);
    return result;
  }

  async getRecommendedCourses(categoryId: string, userId?: string) {
    const courses = await this.courseRepository.getRecommendedCoursesByCategory(categoryId);
    return courses.map((course) => ({ ...course, img: course?.img ? toFileResponseDto(course.img) : null }));
  }

  async getFeaturedCourses(query: GetFeaturedCoursesQueryDTO): Promise<any> {
    const { page = 1, limit = 10 } = query;

    const cacheKey = this.buildFeaturedCoursesCacheKey(page, limit);
    const cachedResult = await CacheService.get<any>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const take = Number(limit);
    const skip = (page - 1) * limit;
    const { courses, total } = await this.courseRepository.getFeaturedCourses(take, skip);

    const result = {
      data: courses.map((course: any) => ({
        ...course,
        img: course.img ? toFileResponseDto(course.img) : null,
      })),
      meta: { total, page: Number(page), limit: Number(limit) },
    };

    await CacheService.set(cacheKey, result, 60 * 60);

    return result;
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
    const { page = 1, limit = 10, status, q } = query;
    const take = Number(limit);
    const skip = (page - 1) * limit;
    const [courses, total] = await this.courseRepository.getInstructorCreatedCourses(
      take,
      skip,
      status,
      instructorId,
      q
    );

    const data = courses.map((course) => ({
      ...course,
      imgUrl: course?.imgUrl ? toAbsoluteURL(course.imgUrl) : null,
    }));

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
    const cacheKey = this.buildCourseDetailCacheKey(id, userId, role, view);
    const cachedResult = await CacheService.get<any>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    let result;
    if (view === 'instructor') {
      const course = await this.courseRepository.getCourseDetailByInstructor(id, userId, role);
      result = {
        ...course,
        img: course.img ? toFileResponseDto(course.img) : null,
        promoVideo: course.promoVideo ? toFileResponseDto(course.promoVideo) : null,
      };
    } else {
      const course = await this.courseRepository.getCourseDetailByStudent(id, userId, role);
      result = {
        ...course,
        img: course.img ? toFileResponseDto(course.img) : null,
        promoVideo: course.promoVideo ? toFileResponseDto(course.promoVideo) : null,
      };
    }

    await CacheService.set(cacheKey, result, 24 * 60 * 60);
    return result;
  }

  async getCourseContent(id: string, userId: string, role?: UserRole, view: 'instructor' | 'student' = 'student') {
    const cacheKey = this.buildCourseContentCacheKey(id, userId, role, view);
    const cachedResult = await CacheService.get<any>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    let result;
    if (view === 'instructor') {
      result = await this.getCourseContentByInstructor(id, userId, role);
    } else {
      const courseContent = await this.getCourseContentByStudent(id, userId, role);
      const indexes = this.buildCourseContentIndexes(courseContent);
      result = { ...courseContent, indexes };
    }

    await CacheService.set(cacheKey, result, 600);
    return result;
  }

  async getCourseContentByInstructor(courseId: string, instructorId: string, role: UserRole | undefined) {
    return this.courseRepository.getCourseContentByInstructor(courseId, instructorId, role);
  }

  async getCourseContentByStudent(id: string, userId: string, role: UserRole | undefined) {
    const course = await this.courseRepository.getCourseContentByStudent(id, userId, role);

    if (!course) throw new NotFoundError('Course not found');

    const courseWithStatus = {
      ...course,
      sections: course.sections.map((section) => ({
        ...section,
        units: section.units.map((unit) => {
          // compute step statuses
          const stepsWithStatus: WithStatus<(typeof unit.steps)[number]>[] = unit.steps.map((s) => {
            const lp = s.learningProgress?.[0];
            const status = lp ? (lp.status as LearningStatus) : 'not_started';
            return { ...s, status };
          });

          // compute excercise statuses
          const excsWithStatus: WithStatus<(typeof unit.excercises)[number]>[] = unit.excercises.map((e) => {
            const lp = e.learningProgress?.[0];
            const status = lp ? (lp.status as LearningStatus) : 'not_started';
            return { ...e, status };
          });

          // compute unit status for lessons: completed only if ALL steps completed
          let unitStatus: LearningStatus | 'not_started' = 'not_started';
          if (unit.type === 'lesson') {
            if (stepsWithStatus.length > 0 && stepsWithStatus.every((st) => st.status === 'completed')) {
              unitStatus = 'completed';
            } else {
              unitStatus = 'not_started';
            }
          } else if (unit.type === 'excercise') {
            unitStatus = excsWithStatus.length > 0 ? excsWithStatus[0].status : 'not_started';
          }

          return {
            ...unit,
            steps: stepsWithStatus,
            excercises: excsWithStatus,
            status: unitStatus,
          };
        }),
      })),
    };

    return courseWithStatus;
  }

  private buildCourseContentIndexes(course: any): CourseIndexes {
    // const parentMap = new Map();
    const ancestorMap = new Map();

    for (const section of course.sections) {
      ancestorMap.set(section.id, []);

      for (const unit of section.units) {
        // parentMap.set(unit.id, section.id);
        ancestorMap.set(unit.id, [section.id]);

        for (const step of unit.steps) {
          // parentMap.set(step.id, unit.id);
          ancestorMap.set(step.id, [unit.id, section.id]);
        }

        for (const ex of unit.excercises) {
          // parentMap.set(ex.id, unit.id);
          ancestorMap.set(ex.id, [unit.id, section.id]);
        }
      }
    }

    return { ancestorMap: Object.fromEntries(ancestorMap) };
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

  async getCourseExercisesGroupedBySection(courseId: string, query: getCourseExercisesGroupedBySectionQueryDto) {
    const { page = 1, limit = 10, type } = query;
    const take = Number(limit);
    const skip = (page - 1) * limit;
    const { sections, total } = await this.sectionRepository.getExercisesGroupedBySection(courseId, skip, take, type);
    const data = sections.map((section) => ({
      id: section.id,
      title: section.title,
      exercises: section.units.map((unit) => ({
        unitId: unit.id,
        title: unit.title,
        ...unit.excercises[0],
        newAssigments: unit.excercises[0]._count.attempts,
        _count: undefined,
      })),
    }));

    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getLearningCoursesByUserId(userId: string, query: GetLearningCoursesQueryDto) {
    const { page = 1, limit = 10, status = 'active' } = query;
    const cacheKey = this.buildLearningCoursesCacheKey(userId, status, Number(page), Number(limit));
    const cachedResult = await CacheService.get<any>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const take = Number(limit);
    const skip = (page - 1) * limit;

    const { enrollments, total } = await this.enrollmentRepository.getEnrollmentsWithCourseByUserId(
      userId,
      skip,
      take,
      status
    );

    const data = enrollments.map((e) => ({
      ...e,
      ...e.course,
      img: e.course?.img ? toFileResponseDto(e.course?.img) : null,
      course: undefined,
    }));
    const result = { data, meta: { total, page: Number(page), limit: Number(limit) } };
    await CacheService.set(cacheKey, result, 60 * 60);
    return result;
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
    await this.invalidateCourseCaches(courseId);
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
    await this.invalidateCourseCaches(courseId);
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
    await this.invalidateCourseCaches(courseId);
  }
}
