import { UpdateExerciseDto } from '@/dtos/exercise.dto';
import { ForbiddenError, NotFoundError } from '@/errors';
import { UserRole } from '@/generated/prisma/enums';
import { EnrollmentRepository } from '@/repositories/enrollment.repository';
import { ExerciseRepository } from '@/repositories/exercise.repository';
import { UnitRepository } from '@/repositories/unit.repository';

export class ExerciseService {
  constructor(
    private exerciseRepository: ExerciseRepository,
    private enrollmentRepository: EnrollmentRepository,
    private unitRepository: UnitRepository
  ) {}

  async getExerciseByUnitId(unitId: string, userId: string, role?: UserRole) {
    const course = await this.unitRepository.getCourseByUnitId(unitId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== userId && role !== 'admin') {
      const enrollment = await this.enrollmentRepository.getEnrollment(course.id, userId);
      if (!enrollment || (enrollment.status !== 'active' && enrollment.status !== 'completed'))
        throw new ForbiddenError('Permission denied: You do not have permission to access this content.');
    }
    const exercise = await this.exerciseRepository.getExerciseByUnitId(unitId);
    return exercise;
  }

  async updateExercise(unitId: string, instructorId: string, payload: UpdateExerciseDto) {
    const course = await this.unitRepository.getCourseByUnitId(unitId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new ForbiddenError('Permission denied: You are not the owner of this course');
    }
    const exercise = await this.exerciseRepository.updateExercise(unitId, payload);

    return exercise;
  }
}
