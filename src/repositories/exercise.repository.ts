import { NotFoundError } from '@/errors';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export class ExerciseRepository {
  async getExerciseByUnitId(unitId: string) {
    const exercise = await prisma.excercise.findFirst({
      where: { unitId },
      include: {
        unit: {
          select: {
            title: true,
          },
        },
      },
    });
    return exercise;
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

  async updateExercise(unitId: string, data: Prisma.ExcerciseUpdateInput) {
    const exercise = await this.getExerciseByUnitId(unitId);
    if (!exercise) throw new NotFoundError('Exercise not found');
    const updatedExercise = await prisma.excercise.update({
      where: { id: exercise.id },
      data,
    });
    return updatedExercise;
  }
}
