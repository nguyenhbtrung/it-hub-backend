import { BadRequestError } from '@/errors';
import { LearningStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

export class LearningProgressRepository {
  async createOrUpdateLearningProgress(data: {
    studentId: string;
    stepId?: string;
    exerciseId?: string;
    status: LearningStatus;
  }) {
    const { studentId, stepId, exerciseId, status } = data;

    if ((!stepId && !exerciseId) || (stepId && exerciseId)) {
      throw new BadRequestError('Either stepId or exerciseId must be provided (but not both).');
    }

    if (stepId) {
      return prisma.learningProgress.upsert({
        where: {
          studentId_stepId: {
            studentId,
            stepId,
          },
        },
        update: {
          status,
        },
        create: {
          studentId,
          stepId,
          status,
        },
      });
    }

    return prisma.learningProgress.upsert({
      where: {
        studentId_excerciseId: {
          studentId,
          excerciseId: exerciseId!,
        },
      },
      update: {
        status,
      },
      create: {
        studentId,
        excerciseId: exerciseId!,
        status,
      },
    });
  }
}
