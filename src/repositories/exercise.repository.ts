import { NotFoundError } from '@/errors';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { toAbsoluteURL } from '@/utils/file';

export class ExerciseRepository {
  async getExerciseAttempStudentIdAndAttachments(attemptId: string) {
    const attemp = await prisma.excerciseAttempt.findUnique({
      where: { id: attemptId },
      select: { studentId: true, attachments: true },
    });
    return attemp;
  }
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
        excerciseQuizzes: {
          include: {
            quiz: true,
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

    if (exercise) {
      (exercise as any).quizzes = exercise.excerciseQuizzes.map((eq) => eq.quiz);
    }

    return exercise;
  }

  async getExerciseSubmission(userId: string, exerciseId: string) {
    const submission = await prisma.excerciseAttempt.findFirst({
      where: { studentId: userId, excerciseId: exerciseId },
      orderBy: { createdAt: 'desc' },
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

  async addExerciseAttemp(data: Prisma.ExcerciseAttemptCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const attemp = await client.excerciseAttempt.create({
      data,
    });
    return attemp;
  }

  async addAttachments(fileIds: string[], attemptId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const attachments = await client.excerciseAttachment.createMany({
      data: fileIds.map((fileId) => ({
        fileId,
        attemptId,
      })),
    });
    return attachments;
  }

  async createQuiz(data: Prisma.QuizCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return await client.quiz.create({
      data,
    });
  }

  async createExerciseQuiz(data: Prisma.ExcerciseQuizCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return await client.excerciseQuiz.create({
      data,
    });
  }

  async updateExercise(unitId: string, data: Prisma.ExcerciseUpdateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;

    const exercise = await this.getExerciseByUnitId(unitId, tx);
    if (!exercise) throw new NotFoundError('Exercise not found');

    const updatedExercise = await client.excercise.update({
      where: { id: exercise.id },
      data,
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
        excerciseQuizzes: {
          include: {
            quiz: true,
          },
        },
      },
    });

    if (updatedExercise?.unit?.materials) {
      updatedExercise.unit.materials = updatedExercise.unit.materials.map((m) => ({
        ...m,
        file: {
          ...m.file,
          url: toAbsoluteURL(m.file.url),
        },
      }));
    }

    if (updatedExercise) {
      (updatedExercise as any).quizzes = updatedExercise.excerciseQuizzes.map((eq) => eq.quiz);
    }

    return updatedExercise;
  }

  async deleteExerciseAttemp(attempId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    await client.excerciseAttempt.delete({
      where: { id: attempId },
    });
  }

  async deleteExerciseQuizzes(exerciseId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;

    const exerciseQuizzes = await client.excerciseQuiz.findMany({
      where: { excerciseId: exerciseId },
      select: { quizId: true },
    });

    const quizIds = exerciseQuizzes.map((eq) => eq.quizId);

    await client.excerciseQuiz.deleteMany({
      where: { excerciseId: exerciseId },
    });

    if (quizIds.length > 0) {
      await client.quiz.deleteMany({
        where: { id: { in: quizIds } },
      });
    }
  }
}
