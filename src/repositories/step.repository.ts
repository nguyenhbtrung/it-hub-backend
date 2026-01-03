import { prisma } from '@/lib/prisma';

export class StepRepository {
  async getCourseByStepId(stepId: string) {
    const step = await prisma.step.findUnique({
      where: { id: stepId },
      select: {
        lesson: {
          select: {
            section: {
              select: {
                course: {
                  select: { id: true, instructorId: true },
                },
              },
            },
          },
        },
      },
    });
    return step?.lesson?.section?.course;
  }

  async deleteStep(stepId: string) {
    await prisma.step.delete({
      where: { id: stepId },
    });
  }
}
