import { CreateCourseDTO, CreateCourseResponseDTO, toCreateCourseResponseDTO } from '@/dtos/coures.dto';
import { CourseEnrollmentStatus, CourseLevel, CourseStatus } from '@/generated/prisma/enums';
import { CourseRepository } from '@/repositories/course.repository';

export class CourseService {
  constructor(private courseRepository: CourseRepository) {}
  async createCourse(payload: CreateCourseDTO, instructorId: string): Promise<CreateCourseResponseDTO> {
    const { title, categoryId, subCategoryId } = payload;
    const slug = '';
    const shortDescription = '';
    const description = '';
    const level = CourseLevel.beginner;
    const totalDuration = 0;
    const enrollmentStatus = CourseEnrollmentStatus.public;
    const status = CourseStatus.draft;
    const keyTakeaway = {};
    const requirements = {};

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
}
