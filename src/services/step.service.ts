import { ForbiddenError, NotFoundError } from '@/errors';
import { StepRepository } from '@/repositories/step.repository';

export class StepService {
  constructor(private stepRepository: StepRepository) {}

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
