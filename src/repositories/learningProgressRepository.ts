import { BadRequestError } from '@/errors';
import { Prisma } from '@/generated/prisma/client';
import { LearningStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { Injectable } from '@ntrg/simple-di';

@Injectable()
export class LearningProgressRepository {
  async getLearningProgressByStepId(studentId: string, stepId: string) {
    const learningProgress = await prisma.learningProgress.findUnique({
      where: {
        studentId_stepId: {
          studentId,
          stepId,
        },
      },
    });
    return learningProgress;
  }
  async createOrUpdateLearningProgress(
    data: {
      studentId: string;
      stepId?: string;
      exerciseId?: string;
      status: LearningStatus;
    },
    tx?: Prisma.TransactionClient
  ) {
    const { studentId, stepId, exerciseId, status } = data;
    const client = tx || prisma;

    if ((!stepId && !exerciseId) || (stepId && exerciseId)) {
      throw new BadRequestError('Either stepId or exerciseId must be provided (but not both).');
    }

    if (stepId) {
      return client.learningProgress.upsert({
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

    return client.learningProgress.upsert({
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
