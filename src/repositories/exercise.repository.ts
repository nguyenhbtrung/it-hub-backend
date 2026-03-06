import { NotFoundError } from '@/errors';
import { ExcerciseType, Prisma } from '@/generated/prisma/client';
import { ExcerciseAttemptWhereInput, ExcerciseWhereInput, UserWhereInput } from '@/generated/prisma/models';
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

  async getExerciseById(id: string) {
    const exercise = await prisma.excercise.findUnique({
      where: { id },
    });
    return exercise;
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

  async getExerciseSubmissions(userId: string, exerciseId: string, take: number, skip: number) {
    const where: ExcerciseAttemptWhereInput = { studentId: userId, excerciseId: exerciseId };
    const [submissions, total] = await Promise.all([
      prisma.excerciseAttempt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
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
      }),
      prisma.excerciseAttempt.count({ where }),
    ]);

    return {
      submissions,
      total,
    };
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

  // async getExercisesByCourseId(courseId: string, skip: number, take: number, type: ExcerciseType) {
  //   const where: ExcerciseWhereInput = {
  //     unit: {
  //       section: {
  //         courseId,
  //       },
  //     },
  //     type,
  //   };
  //   const [exercises, total] = await Promise.all([
  //     prisma.excercise.findMany({
  //       where,
  //       skip,
  //       take,
  //       select: {
  //         id: true,
  //         type: true,
  //         description: true,
  //         content: true,
  //         deadline: true,
  //         unit: {
  //           select: {

  //           }
  //         }
  //       }
  //     }),
  //   ]);
  // }

  async getExerciseWithCourseIdByUnitId(unitId: string) {
    return prisma.excercise.findFirst({
      where: { unitId },
      select: {
        id: true,
        unit: {
          select: {
            title: true,
            section: {
              select: {
                courseId: true,
              },
            },
          },
        },
      },
    });
  }

  async countDistinctStudentsAttempted(exerciseId: string) {
    const result = await prisma.excerciseAttempt.findMany({
      where: { excerciseId: exerciseId },
      distinct: ['studentId'],
      select: { studentId: true },
    });

    return result.length;
  }

  async countUnscoredAttempts(exerciseId: string) {
    return prisma.excerciseAttempt.count({
      where: {
        excerciseId: exerciseId,
        score: null,
      },
    });
  }

  async countScoredAttempts(exerciseId: string) {
    return prisma.excerciseAttempt.count({
      where: {
        excerciseId: exerciseId,
        score: {
          not: null,
        },
      },
    });
  }

  async getAverageScore(exerciseId: string): Promise<number> {
    const result = await prisma.excerciseAttempt.aggregate({
      where: {
        excerciseId: exerciseId,
        score: {
          not: null,
        },
      },
      _avg: {
        score: true,
      },
    });

    return result._avg.score ?? 0;
  }

  async getStudentSubmissionsByUnitId(
    exerciseId: string,
    courseId: string,
    take: number,
    skip: number,
    q?: string | undefined,
    status?: 'all' | 'pending' | 'graded' | 'not_submitted'
  ) {
    const searchConditions = q
      ? [
          { fullname: { contains: q, mode: 'insensitive' as const } },
          { email: { contains: q, mode: 'insensitive' as const } },
        ]
      : [];
    const where: UserWhereInput = {
      enrollments: {
        some: {
          courseId,
          status: {
            in: ['active', 'completed'],
          },
        },
      },
      OR: q ? searchConditions : undefined,

      ...(status === 'pending' && {
        excerciseAttempts: {
          some: {
            excerciseId: exerciseId,
            score: null,
          },
        },
      }),

      ...(status === 'graded' && {
        excerciseAttempts: {
          some: {
            excerciseId: exerciseId,
            score: { not: null },
          },
        },
        NOT: {
          excerciseAttempts: {
            some: {
              excerciseId: exerciseId,
              score: null,
            },
          },
        },
      }),

      ...(status === 'not_submitted' && {
        excerciseAttempts: {
          none: {
            excerciseId: exerciseId,
          },
        },
      }),
    };
    const [submissions, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take,
        skip,
        select: {
          email: true,
          fullname: true,
          avatar: {
            select: {
              url: true,
            },
          },
          excerciseAttempts: {
            where: {
              excerciseId: exerciseId,
            },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              createdAt: true,
              score: true,
            },
          },
        },
      }),
      prisma.user.count({
        where,
      }),
    ]);
    return { submissions, total };
  }

  async getExerciseAttemptById(id: string) {
    const attempt = await prisma.excerciseAttempt.findUnique({
      where: { id },
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
        student: {
          select: {
            id: true,
            email: true,
            fullname: true,
            avatar: {
              select: {
                url: true,
              },
            },
          },
        },
      },
    });
    return attempt;
  }

  async getAttempSequence(exerciseId: string, studentId: string, createdAt: Date) {
    return prisma.excerciseAttempt.count({
      where: {
        excerciseId: exerciseId,
        studentId: studentId,
        createdAt: { lte: createdAt },
      },
    });
  }

  async getSubmissionsByUnitAndStudent(studentId: string, unitId: string, skip: number, take: number) {
    const where: ExcerciseAttemptWhereInput = {
      studentId,
      excercise: {
        unitId,
      },
    };
    const [submissions, total] = await Promise.all([
      prisma.excerciseAttempt.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          score: true,
          createdAt: true,
        },
      }),
      prisma.excerciseAttempt.count({
        where,
      }),
    ]);
    return { submissions, total };
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

  async updateExerciseAttempt(id: string, data: Prisma.ExcerciseAttemptUpdateInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const attempt = await client.excerciseAttempt.update({
      where: { id },
      data,
    });
    return attempt;
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
