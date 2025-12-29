import {
  CreateCourseDTO,
  CreateCourseResponseDTO,
  CreatedCourseResponseDTO,
  GetCourseDetailByInstructorResponseDTO,
  GetMyCreatedCoursesDTO,
  toCreateCourseResponseDTO,
} from '@/dtos/coures.dto';
import { CourseEnrollmentStatus, CourseLevel, CourseStatus } from '@/generated/prisma/enums';
import { CourseRepository } from '@/repositories/course.repository';
import slugify from 'slugify';

export class CourseService {
  constructor(private courseRepository: CourseRepository) {}
  async createCourse(payload: CreateCourseDTO, instructorId: string): Promise<CreateCourseResponseDTO> {
    const { title, categoryId, subCategoryId } = payload;
    const slug = slugify(title, { lower: true, strict: true, locale: 'vi' }) + '-' + Date.now();
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
