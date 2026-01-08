import { UpdateUnitDto } from '@/dtos/unit.dto';
import { Prisma, Step } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export class UnitRepository {
  async getPreviousUnit(sectionId: string, order: number) {
    const nextUnit = await prisma.unit.findFirst({
      where: { sectionId, order: { lt: order } },
      orderBy: { order: 'desc' },
      include: { steps: true },
    });
    return nextUnit;
  }

  async getNextUnit(sectionId: string, order: number) {
    const nextUnit = await prisma.unit.findFirst({
      where: { sectionId, order: { gt: order } },
      orderBy: { order: 'asc' },
    });
    return nextUnit;
  }

  async getUnitWithRelationById(id: string) {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        steps: true,
        section: true,
      },
    });
    return unit;
  }
  async getUnitById(id: string) {
    const unit = await prisma.unit.findUnique({
      where: { id },
    });
    return unit;
  }
  async getCourseByUnitId(unitId: string) {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: {
        section: {
          select: {
            course: {
              select: { id: true, instructorId: true },
            },
          },
        },
      },
    });
    return unit?.section?.course;
  }

  async getMaxStepOrder(lessonId: string) {
    const maxOrder = await prisma.step.aggregate({ where: { lessonId }, _max: { order: true } });
    return maxOrder;
  }

  async addStep(data: Prisma.StepCreateInput): Promise<Step> {
    const newStep = await prisma.step.create({ data });
    return newStep;
  }

  async updateUnit(unitId: string, data: UpdateUnitDto) {
    const unit = await prisma.unit.update({
      where: { id: unitId },
      data,
    });
    return unit;
  }

  async deleteUnit(unitId: string) {
    await prisma.unit.delete({
      where: { id: unitId },
    });
  }
}
