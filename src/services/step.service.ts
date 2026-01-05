import { UpdateStepDto } from '@/dtos/step.dto';
import { ForbiddenError, NotFoundError } from '@/errors';
import { UserRole } from '@/generated/prisma/enums';
import { EnrollmentRepository } from '@/repositories/enrollment.repository';
import { StepRepository } from '@/repositories/step.repository';
import { estimateDurationFromContent, extractPlainText } from '@/utils/content';
import { title } from 'node:process';
import { duration } from 'node_modules/zod/v4/classic/iso.cjs';

export class StepService {
  constructor(
    private stepRepository: StepRepository,
    private enrollmentRepository: EnrollmentRepository
  ) {}

  async getStepById(stepId: string, userId: string, role?: UserRole) {
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
    if (payload.content) {
      const duration = estimateDurationFromContent(payload.content);
      const step = await this.stepRepository.updateStep(stepId, {
        title: payload.title,
        content: payload.content,
        duration: duration.durationSeconds,
      });
      return step;
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
