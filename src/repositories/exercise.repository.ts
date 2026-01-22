import { NotFoundError } from '@/errors';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { toAbsoluteURL } from '@/utils/file';

export class ExerciseRepository {
  async getExerciseContentByUnitId(unitId: string) {
    const exercise = await prisma.excercise.findFirst({
      where: { unitId },
      select: {
        id: true,
        content: true,
      },
    });
    return exercise;
  }
  async getExerciseByUnitId(unitId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const exercise = await client.excercise.findFirst({
      where: { unitId },
      include: {
        unit: {
          select: {
            title: true,
            materials: {
              select: {
                id: true,
                file: {
                  select: {
                    id: true,
                    name: true,
                    size: true,
                    type: true,
                    mimeType: true,
                    url: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (exercise?.unit?.materials) {
      exercise.unit.materials = exercise.unit.materials.map((m) => ({
        ...m,
        file: {
          ...m.file,
          url: toAbsoluteURL(m.file.url),
        },
      }));
    }

    return exercise;
  }

  async getExerciseSubmission(userId: string, exerciseId: string) {
    const submission = await prisma.excerciseAttempt.findFirst({
      where: { studentId: userId, excerciseId: exerciseId },
      include: {
        attachments: {
          select: {
            id: true,
            file: {
              select: {
                id: true,
                name: true,
                size: true,
                type: true,
                mimeType: true,
                url: true,
              },
            },
          },
        },
      },
    });

    if (submission?.attachments) {
      submission.attachments = submission.attachments.map((a) => ({
        ...a,
        file: {
          ...a.file,
          url: toAbsoluteURL(a.file.url),
        },
      }));
    }

    return submission;
  }

  async getCourseByExerciseId(exerciseId: string) {
    const exercise = await prisma.excercise.findUnique({
      where: { id: exerciseId },
      select: {
        unit: {
          select: {
            section: {
              select: {
                course: {
                  select: {
                    id: true,
                    instructorId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return exercise?.unit?.section?.course;
  }

  async addExerciseAttemp(data: Prisma.ExcerciseAttemptCreateInput) {
    const attemp = await prisma.excerciseAttempt.create({
      data,
    });
    return attemp;
  }

  async addAttachments(fileIds: string[], attemptId: string) {
    const attachments = await prisma.excerciseAttachment.createMany({
      data: fileIds.map((fileId) => ({
        fileId,
        attemptId,
      })),
    });
    return attachments;
  }

  async updateExercise(unitId: string, data: Prisma.ExcerciseUpdateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const exercise = await this.getExerciseByUnitId(unitId, tx);
    if (!exercise) throw new NotFoundError('Exercise not found');
    const updatedExercise = await client.excercise.update({
      where: { id: exercise.id },
      data,
    });
    return updatedExercise;
  }
}
