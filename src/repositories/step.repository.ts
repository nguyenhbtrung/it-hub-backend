import { UpdateStepDto } from '@/dtos/step.dto';
import { NotFoundError } from '@/errors';
import { prisma } from '@/lib/prisma';
import { title } from 'node:process';

export interface UpdateStepData {
  title?: string | undefined;
  content?: any;
  duration?: number;
}

export class StepRepository {
  async getStepContextData(stepId: string, scope: 'step' | 'lesson') {
    const data = await prisma.step.findUnique({
      where: { id: stepId },
      select: {
        id: true,
        title: true,
        order: true,
        content: true,
        lesson: {
          select: {
            id: true,
            title: true,
            description: true,
            steps: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                content: true,
                order: true,
              },
            },
          },
        },
      },
    });
    if (!data) throw new NotFoundError('Context not found');
    if (scope === 'lesson') {
      return {
        currentStepId: data?.id,
        lesson: {
          id: data?.lesson.id,
          title: data?.lesson.title,
          description: data?.lesson.description,
        },
        steps: data?.lesson.steps,
      };
    }

    const position = data?.lesson.steps.findIndex((s) => s.id === data?.id) ?? -1;
    return {
      lesson: {
        id: data?.lesson.id,
        title: data?.lesson.title,
        description: data?.lesson.description,
      },
      step: {
        id: data?.id,
        title: data?.title,
        content: data?.content,
        position: position >= 0 ? position + 1 : null,
        total: data?.lesson.steps.length,
      },
    };
  }
  async getStepById(id: string) {
    const step = await prisma.step.findUnique({
      where: { id },
    });
    return step;
  }
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

  async updateStep(stepId: string, data: UpdateStepData) {
    const step = await prisma.step.update({
      where: { id: stepId },
      data,
    });
    return step;
  }

  async deleteStep(stepId: string) {
    await prisma.step.delete({
      where: { id: stepId },
    });
  }
}
