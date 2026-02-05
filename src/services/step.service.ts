import { UpdateStepDto } from '@/dtos/step.dto';
import { ForbiddenError, NotFoundError } from '@/errors';
import { UserRole } from '@/generated/prisma/enums';
import { EnrollmentRepository } from '@/repositories/enrollment.repository';
import { FileRepository } from '@/repositories/file.repository';
import { StepRepository } from '@/repositories/step.repository';
import { UnitOfWork } from '@/repositories/unitOfWork';
import { diffFileIds, estimateDurationFromContent, extractFileIdsFromContent, extractPlainText } from '@/utils/content';
import { title } from 'node:process';
import { duration } from 'node_modules/zod/v4/classic/iso.cjs';
import { AiService } from './ai.service';

export class StepService {
  constructor(
    private stepRepository: StepRepository,
    private enrollmentRepository: EnrollmentRepository,
    private fileRepository: FileRepository,
    private uow: UnitOfWork,
    private aiService: AiService
  ) {}

  async getStepById(stepId: string, userId: string, role?: UserRole) {
    const course = await this.stepRepository.getCourseByStepId(stepId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== userId && role !== 'admin') {
      const enrollment = await this.enrollmentRepository.getEnrollment(course.id, userId);
      if (!enrollment || (enrollment.status !== 'active' && enrollment.status !== 'completed'))
        throw new ForbiddenError('Permission denied: You do not have permission to access this content.');
    }
    const step = await this.stepRepository.getStepById(stepId);
    return step;
  }

  async updateStep(stepId: string, instructorId: string, payload: UpdateStepDto) {
    const course = await this.stepRepository.getCourseByStepId(stepId);
    if (!course) throw new NotFoundError('Course not found');
    if (course.instructorId !== instructorId) throw new ForbiddenError('Permission denied');

    if (payload.content) {
      const currentContent = await this.stepRepository.getStepContentById(stepId);

      const oldContent = currentContent;
      const newContent = payload.content;
      const { removed, added } = diffFileIds(oldContent, newContent);

      const step = await this.uow.execute(async (tx) => {
        if (removed.length > 0) await this.fileRepository.markFilesStatus(removed, 'unused', tx);
        if (added.length > 0) await this.fileRepository.markFilesStatus(added, 'active', tx);

        const newFileIds = extractFileIdsFromContent(newContent);
        if (newFileIds.length > 0) await this.fileRepository.createOrUpdateFileUsage(newFileIds, { stepId }, tx);

        const duration = estimateDurationFromContent(payload.content);
        const step = await this.stepRepository.updateStep(
          stepId,
          {
            title: payload.title,
            content: payload.content,
            duration: duration.durationSeconds,
          },
          tx
        );
        await this.aiService.embedStepContentCore(stepId, tx);
        return step;
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
