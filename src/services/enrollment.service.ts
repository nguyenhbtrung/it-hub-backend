import { CreateEnrollmentDto, UpdateEnrollmentDto } from '@/dtos/enrollment.dto';
import { ForbiddenError, NotFoundError } from '@/errors';
import { CourseRepository } from '@/repositories/course.repository';
import { EnrollmentRepository } from '@/repositories/enrollment.repository';

export class EnrollmentService {
  constructor(
    private enrollmentRepository: EnrollmentRepository,
    private courseRepository: CourseRepository
  ) {}

  async createEnrollment(
    courseId: string,
    userId: string | undefined,
    myId: string,
    role: string | undefined,
    payload: CreateEnrollmentDto
  ) {
    if (userId) {
      const course = await this.courseRepository.getCourseInstructorId(courseId);

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      if (course.instructorId !== myId && role !== 'admin') {
        throw new ForbiddenError('Permission denied');
      }
    }
    userId = userId ? userId : myId;

    const enrollment = await this.enrollmentRepository.createEnrollment(courseId, userId, payload.status);
    return enrollment;
  }

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

    const enrolledAt = payload.status === 'active' ? new Date() : undefined;
    const data = { ...payload, enrolledAt };

    const enrollment = await this.enrollmentRepository.updateEnrollment(courseId, userId, data);
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

    userId = userId ? userId : myId;

    await this.enrollmentRepository.deleteEnrollment(courseId, userId);
  }
}
