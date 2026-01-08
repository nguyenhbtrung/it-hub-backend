import { UpdateEnrollmentDto } from '@/dtos/enrollment.dto';
import { ForbiddenError, NotFoundError } from '@/errors';
import { CourseRepository } from '@/repositories/course.repository';
import { EnrollmentRepository } from '@/repositories/enrollment.repository';

export class EnrollmentService {
  constructor(
    private enrollmentRepository: EnrollmentRepository,
    private courseRepository: CourseRepository
  ) {}

  async updateEnrollment(
    courseId: string,
    userId: string,
    instructorId: string,
    role: string | undefined,
    payload: UpdateEnrollmentDto
  ) {
    const course = await this.courseRepository.getCourseInstructorId(courseId);

    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== instructorId && role !== 'admin') {
      throw new ForbiddenError('Permission denied');
    }

    const enrollment = await this.enrollmentRepository.updateEnrollment(courseId, userId, payload);
    return enrollment;
  }

  async deleteEnrollment(courseId: string, userId: string | undefined, myId: string, role: string | undefined) {
    if (userId) {
      const course = await this.courseRepository.getCourseInstructorId(courseId);

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      if (course.instructorId !== myId && role !== 'admin') {
        throw new ForbiddenError('Permission denied');
      }
    }
    userId = myId;

    await this.enrollmentRepository.deleteEnrollment(courseId, userId);
  }
}
