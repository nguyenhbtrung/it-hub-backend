import { UpdateSectionDto } from '@/dtos/section.dto';
import { Prisma, Unit } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export class SectionRepository {
  async getCourseBySectionId(sectionId: string) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      select: {
        course: { select: { id: true, instructorId: true } },
      },
    });
    return section?.course;
  }

  async getMaxUnitOrder(sectionId: string) {
    const maxOrder = await prisma.unit.aggregate({ where: { sectionId }, _max: { order: true } });
    return maxOrder;
  }

  async addUnit(data: Prisma.UnitCreateInput): Promise<Unit> {
    const newUnit = await prisma.unit.create({ data });
    if (data.type === 'excercise') {
      const excercise = await prisma.excercise.create({
        data: {
          unit: { connect: { id: newUnit.id } },
          type: 'assignment',
          title: '',
          description: '',
          content: {},
        },
      });
    }
    return newUnit;
  }

  async updateSection(sectionId: string, data: UpdateSectionDto) {
    const section = await prisma.section.update({
      where: { id: sectionId },
      data,
    });
    return section;
  }

  async deleteSection(sectionId: string) {
    await prisma.section.delete({
      where: { id: sectionId },
    });
  }
}
