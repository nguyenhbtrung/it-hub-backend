import { NotFoundError } from '@/errors';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { toAbsoluteURL } from '@/utils/file';

export class ExerciseRepository {
  async getExerciseByUnitId(unitId: string) {
    const exercise = await prisma.excercise.findFirst({
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
