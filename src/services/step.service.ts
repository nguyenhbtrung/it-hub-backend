import { UpdateStepDto } from '@/dtos/step.dto';
import { ForbiddenError, NotFoundError } from '@/errors';
import { EnrollmentRepository } from '@/repositories/enrollment.repository';
import { StepRepository } from '@/repositories/step.repository';

export class StepService {
  constructor(
    private stepRepository: StepRepository,
    private enrollmentRepository: EnrollmentRepository
  ) {}

  async getStepById(stepId: string, userId: string) {
    const course = await this.stepRepository.getCourseByStepId(stepId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== userId) {
      const enrollment = await this.enrollmentRepository.getEnrollment(course.id, userId);
      if (!enrollment || (enrollment.status !== 'active' && enrollment.status !== 'completed'))
        throw new ForbiddenError('Permission denied: You do not have permission to access this content.');
    }
    const step = await this.stepRepository.getStepById(stepId);
    return step;
  }

  async updateStep(stepId: string, instructorId: string, payload: UpdateStepDto) {
    const course = await this.stepRepository.getCourseByStepId(stepId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new ForbiddenError('Permission denied: You are not the owner of this course');
    }
    const step = await this.stepRepository.updateStep(stepId, payload);
    return step;
  }

  async deleteStep(instructorId: string, stepId: string) {
    const course = await this.stepRepository.getCourseByStepId(stepId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new ForbiddenError('Permission denied: You are not the owner of this course');
    }
    await this.stepRepository.deleteStep(stepId);
  }
}
