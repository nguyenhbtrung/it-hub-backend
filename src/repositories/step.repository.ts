import { UpdateStepDto } from '@/dtos/step.dto';
import { NotFoundError } from '@/errors';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { EmbeddingChunk } from '@/types/embedding.type';
import { title } from 'node:process';

export interface UpdateStepData {
  title?: string | undefined;
  content?: any;
  duration?: number;
}

export class StepRepository {
  async getCourseSlugByStepId(stepId: string) {
    const step = await prisma.step.findUnique({
      where: { id: stepId },
      select: {
        lesson: {
          select: {
            section: {
              select: {
                course: {
                  select: {
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return step?.lesson.section.course.slug;
  }
  async getPreviousStep(lessonId: string, currentOrder: number) {
    const nextStep = await prisma.step.findFirst({
      where: { lessonId, order: { lt: currentOrder } },
      orderBy: { order: 'desc' },
    });
    return nextStep;
  }
  async getNextStep(lessonId: string, currentOrder: number) {
    const nextStep = await prisma.step.findFirst({
      where: { lessonId, order: { gt: currentOrder } },
      orderBy: { order: 'asc' },
    });
    return nextStep;
  }
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
  async getStepContentById(id: string) {
    const step = await prisma.step.findUnique({
      where: { id },
      select: {
        content: true,
      },
    });
    return step?.content;
  }

  async getStepById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const step = await client.step.findUnique({
      where: { id },
    });
    return step;
  }
  async getStepWithRelationById(id: string) {
    const step = await prisma.step.findUnique({
      where: { id },
      include: {
        lesson: {
          include: {
            section: true,
          },
        },
      },
    });
    return step;
  }

  async getStepWithRelationByIds(ids: string[]) {
    const step = await prisma.step.findMany({
      where: { id: { in: ids } },
      include: {
        lesson: {
          include: {
            section: true,
          },
        },
      },
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

  async getRelatedIdsByStepId(stepId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const step = await client.step.findUnique({
      where: { id: stepId },
      select: {
        id: true,
        lesson: {
          select: {
            id: true,
            section: {
              select: {
                id: true,
                course: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!step) throw new NotFoundError('Step not found');
    return {
      stepId,
      unitId: step?.lesson.id,
      sectionId: step?.lesson.section.id,
      courseId: step?.lesson.section.course.id,
    };
  }

  async getTopKStepChunk(
    stepId: string,
    courseId: string | undefined,
    sectionId: string | undefined,
    vector: number[],
    k: number = 20,
    minSimilarity: number = 0.6
  ) {
    const where: string[] = [];
    const params: any[] = [];

    const vectorLiteral = `[${vector.join(',')}]`;
    params.push(vectorLiteral);

    const maxDistance = 1 - minSimilarity;
    params.push(maxDistance);

    if (courseId) {
      params.push(courseId);
      where.push(`"courseId" = $${params.length}`);
    }

    if (sectionId) {
      params.push(sectionId);
      where.push(`"sectionId" = $${params.length}`);
    }

    // if (stepId) {
    //   params.push(stepId);
    //   where.push(`"stepId" = $${params.length}`);
    // }

    const whereClause = `
    WHERE (embedding <=> $1::vector) <= $2
    ${where.length ? 'AND ' + where.join(' AND ') : ''}
  `;

    const query = `
    SELECT
      "stepId",
      "courseId",
      "sectionId",
      "unitId",
      "chunkIndex",
      "content",
      embedding <=> $1 AS distance
    FROM step_embeddings
    ${whereClause}
    ORDER BY distance ASC
    LIMIT ${k}
  `;

    return prisma.$queryRawUnsafe(query, ...params);
  }

  async updateStep(stepId: string, data: UpdateStepData, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const step = await client.step.update({
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

  async createStepEmbeddings(
    data: {
      stepId: string;
      unitId: string;
      sectionId: string;
      courseId: string;
      embeddings: EmbeddingChunk[];
    },
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || prisma;

    const queries = data.embeddings.map((item) => {
      const vectorLiteral = `[${item.embedding.join(',')}]`;

      return client.$executeRaw`
      INSERT INTO "step_embeddings" (
        "id",
        "stepId",
        "unitId",
        "sectionId",
        "courseId",
        "chunkIndex",
        "content",
        "embedding"
      )
      VALUES (
        ${crypto.randomUUID()},
        ${data.stepId},
        ${data.unitId},
        ${data.sectionId},
        ${data.courseId},
        ${item.chunkIndex},
        ${item.content},
        ${vectorLiteral}::vector
      )
    `;
    });

    if (tx) {
      for (const q of queries) {
        await q;
      }
      return;
    }

    await prisma.$transaction(queries);
  }

  async deleteStepEmbeddings(stepId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    await client.stepEmbedding.deleteMany({
      where: { stepId },
    });
  }
}
